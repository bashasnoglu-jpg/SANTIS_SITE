import { eq } from 'drizzle-orm';
import { getDbClient } from '../../db/client';
import { bookings, bookingStatusEnum } from '../../db/schema/chronos';
import { services, rooms } from '../../db/schema/core';
import { domainEvents } from '../../db/schema/intelligence';
import { mapPostgresError, InvalidBookingDataError } from './booking_errors';

export interface CreateBookingInput {
  tenantId: string;
  locationId: string;
  clientId: string;
  serviceId: string;
  therapistId?: string;
  roomId?: string;
  startAt: Date;
  status?: typeof bookingStatusEnum.enumValues[number];
  actorId?: string;
  correlationId?: string;
  notes?: string;
}

export interface BookingCommandContext {
  // Reserved for future context like auth token, tracing id
}

function assertOperationalBookingReady(input: CreateBookingInput, status: string) {
  const operationalStatuses = ['confirmed', 'hold', 'checked_in', 'completed'];
  if (operationalStatuses.includes(status)) {
    if (!input.therapistId || !input.roomId) {
      throw new InvalidBookingDataError(`Operational bookings (status: ${status}) require both therapistId and roomId to ensure overlap protection.`);
    }
  }
}

export const createBookingCommand = async (input: CreateBookingInput, context?: BookingCommandContext) => {
  // 1. Validate required input
  if (!input.tenantId || !input.locationId || !input.clientId || !input.serviceId || !input.startAt) {
    throw new Error('Missing required booking fields.');
  }

  const bookingStatus = input.status || 'confirmed';
  
  // 1b. Validate operational strictness
  assertOperationalBookingReady(input, bookingStatus);

  const db = getDbClient();

  try {
    return await db.transaction(async (tx) => {
      // 2. Load service by serviceId
      const [service] = await tx.select().from(services).where(eq(services.id, input.serviceId));
      if (!service) {
        throw new Error(`Service with ID ${input.serviceId} not found.`);
      }

      // 3. Load room by roomId (if provided) to get its cleaning buffer, fallback to service buffer
      let roomBuffer = service.cleaningBufferMinutes;
      if (input.roomId) {
        const [room] = await tx.select().from(rooms).where(eq(rooms.id, input.roomId));
        if (!room) {
          throw new Error(`Room with ID ${input.roomId} not found.`);
        }
        roomBuffer = room.cleaningBufferMinutes;
      }

      // 4. Read service duration
      const effectiveDuration = service.durationMinutes;

      // 5. Read room cleaning buffer and snapshot it
      const cleaningBuffer = roomBuffer;

      // 6 & 7. Insert booking (PostgreSQL exclusion constraints handle therapist/room overlaps)
      const [booking] = await tx.insert(bookings).values({
        tenantId: input.tenantId,
        locationId: input.locationId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        therapistId: input.therapistId || null,
        roomId: input.roomId || null,
        startAt: input.startAt,
        effectiveDurationMinutes: effectiveDuration,
        roomCleaningBufferMinutes: cleaningBuffer,
        status: bookingStatus as any,
      }).returning({ id: bookings.id });

      // 8. Insert domain_events row in the same transaction
      const payload = {
        bookingId: booking.id,
        serviceId: input.serviceId,
        therapistId: input.therapistId || null,
        roomId: input.roomId || null,
        startAt: input.startAt.toISOString(),
        duration: effectiveDuration,
        buffer: cleaningBuffer,
        notes: input.notes,
      };

      const [event] = await tx.insert(domainEvents).values({
        tenantId: input.tenantId,
        eventType: 'BOOKING_CREATED',
        aggregateType: 'booking',
        aggregateId: booking.id,
        payload: payload,
        actorId: input.actorId || null,
        correlationId: input.correlationId || null,
      }).returning({ id: domainEvents.id });

      // 9. Return booking id and event id
      return {
        bookingId: booking.id,
        eventId: event.id,
      };
    });
  } catch (error) {
    // 10. Map database errors into booking domain errors
    throw mapPostgresError(error);
  }
};
