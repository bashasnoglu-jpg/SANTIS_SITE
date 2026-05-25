import { 
  pgTable, 
  uuid, 
  varchar, 
  timestamp, 
  integer, 
  boolean, 
  time, 
  text, 
  jsonb,
  pgEnum,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roomTypeEnum = pgEnum('room_type', [
  'massage', 'hammam', 'facial', 'couple', 'vip_suite', 'wet_room', 'medical'
]);

export const bookingSourceEnum = pgEnum('booking_source', [
  'manual', 'online', 'hotel_front_desk', 'concierge', 'phone', 'walk_in'
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'draft', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
]);

export const bookingHoldStatusEnum = pgEnum('booking_hold_status', [
  'active', 'expired', 'released', 'confirmed'
]);

// Tables
export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const spaAreas = pgTable('spa_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  defaultSlotIntervalMinutes: integer('default_slot_interval_minutes').notNull().default(15),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const treatmentRooms = pgTable('treatment_rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  spaAreaId: uuid('spa_area_id').notNull().references(() => spaAreas.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  roomType: roomTypeEnum('room_type').notNull(),
  capacity: integer('capacity').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const therapists = pgTable('therapists', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  cleanupMinutes: integer('cleanup_minutes').notNull().default(15),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const serviceRoomCompatibilities = pgTable('service_room_compatibilities', {
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => treatmentRooms.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.serviceId, t.roomId] })
}));

export const serviceTherapistCompatibilities = pgTable('service_therapist_compatibilities', {
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  therapistId: uuid('therapist_id').notNull().references(() => therapists.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.serviceId, t.therapistId] })
}));

export const operatingHours = pgTable('operating_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  openTime: time('open_time').notNull(),
  closeTime: time('close_time').notNull()
});

export const therapistShifts = pgTable('therapist_shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  therapistId: uuid('therapist_id').notNull().references(() => therapists.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  recurrenceRule: text('recurrence_rule')
});

export const blockers = pgTable('blockers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  roomId: uuid('room_id').references(() => treatmentRooms.id, { onDelete: 'cascade' }),
  therapistId: uuid('therapist_id').references(() => therapists.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason').notNull()
});

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  roomId: uuid('room_id').notNull().references(() => treatmentRooms.id),
  therapistId: uuid('therapist_id').notNull().references(() => therapists.id),
  serviceStartTime: timestamp('service_start_time', { withTimezone: true }).notNull(),
  serviceEndTime: timestamp('service_end_time', { withTimezone: true }).notNull(),
  cleanupEndTime: timestamp('cleanup_end_time', { withTimezone: true }).notNull(),
  bookingSource: bookingSourceEnum('booking_source').notNull(),
  bookingStatus: bookingStatusEnum('booking_status').notNull(),
  customerInfo: jsonb('customer_info').notNull().default('{}'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const bookingHolds = pgTable('booking_holds', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  roomId: uuid('room_id').notNull().references(() => treatmentRooms.id),
  therapistId: uuid('therapist_id').notNull().references(() => therapists.id),
  serviceStartTime: timestamp('service_start_time', { withTimezone: true }).notNull(),
  serviceEndTime: timestamp('service_end_time', { withTimezone: true }).notNull(),
  cleanupEndTime: timestamp('cleanup_end_time', { withTimezone: true }).notNull(),
  holdTokenHash: text('hold_token_hash').notNull().unique(),
  status: bookingHoldStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
