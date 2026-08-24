import { and, eq, gte, gt, lt, or, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { createHash } from "node:crypto";
import { bookings, bookingHolds } from "../schema/scheduling.js";
import { HydratedBookingGuardContext, SchedulingRepository } from "./scheduling.repository.js";

export interface Phase4HCandidate {
  tenant_id: string;
  service_id: string;
  room_id: string;
  therapist_id: string;
  service_start_time: string;
  service_end_time?: string | null;
  cleanup_end_time?: string | null;
  duration_minutes?: number | null;
  cleanup_minutes?: number | null;
}

export interface ResolvedPhase4HCandidate {
  tenant_id: string;
  service_id: string;
  room_id: string;
  therapist_id: string;
  service_start_time: string;
  service_end_time: string;
  cleanup_end_time: string;
}

function advisoryInt(value: string): number {
  return parseInt(createHash("md5").update(value).digest("hex").slice(0, 8), 16) | 0;
}

export function getBookingResourceAdvisoryLocks(
  tenantId: string,
  roomId: string,
  therapistId: string,
): Array<readonly [number, number]> {
  const tenantKey = advisoryInt(`tenant:${tenantId}`);
  return [`room:${roomId}`, `therapist:${therapistId}`]
    .sort()
    .map((resource) => [tenantKey, advisoryInt(resource)] as const);
}

export function resolvePhase4HCandidate(candidate: Phase4HCandidate): ResolvedPhase4HCandidate | null {
  if (!candidate.tenant_id || !candidate.service_id || !candidate.room_id || !candidate.therapist_id || !candidate.service_start_time) {
    return null;
  }

  const startMs = Date.parse(candidate.service_start_time);
  if (!Number.isFinite(startMs)) return null;

  let endMs: number;
  if (candidate.service_end_time) {
    endMs = Date.parse(candidate.service_end_time);
  } else if (candidate.duration_minutes && candidate.duration_minutes > 0) {
    endMs = startMs + candidate.duration_minutes * 60_000;
  } else {
    return null;
  }
  if (!Number.isFinite(endMs) || endMs <= startMs) return null;

  let cleanupEndMs: number;
  if (candidate.cleanup_end_time) {
    cleanupEndMs = Date.parse(candidate.cleanup_end_time);
  } else {
    const cleanupMinutes = candidate.cleanup_minutes ?? 0;
    if (!Number.isFinite(cleanupMinutes) || cleanupMinutes < 0) return null;
    cleanupEndMs = endMs + cleanupMinutes * 60_000;
  }
  if (!Number.isFinite(cleanupEndMs) || cleanupEndMs < endMs) return null;

  return {
    tenant_id: candidate.tenant_id,
    service_id: candidate.service_id,
    room_id: candidate.room_id,
    therapist_id: candidate.therapist_id,
    service_start_time: new Date(startMs).toISOString(),
    service_end_time: new Date(endMs).toISOString(),
    cleanup_end_time: new Date(cleanupEndMs).toISOString(),
  };
}

async function acquireResourceLocks(
  tx: any,
  tenantId: string,
  roomId: string,
  therapistId: string,
): Promise<void> {
  for (const [tenantKey, resourceKey] of getBookingResourceAdvisoryLocks(tenantId, roomId, therapistId)) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${tenantKey}, ${resourceKey})`);
  }
}

async function hasActiveConflictingHold(
  tx: any,
  proposed: ResolvedPhase4HCandidate,
): Promise<boolean> {
  const start = new Date(proposed.service_start_time);
  const end = new Date(proposed.service_end_time);
  const cleanupEnd = new Date(proposed.cleanup_end_time);
  const now = new Date();

  const rows = await tx.select().from(bookingHolds).where(
    and(
      eq(bookingHolds.tenantId, proposed.tenant_id),
      eq(bookingHolds.status, "active"),
      gte(bookingHolds.expiresAt, now),
      or(
        and(
          eq(bookingHolds.roomId, proposed.room_id),
          lt(bookingHolds.serviceStartTime, cleanupEnd),
          gt(bookingHolds.cleanupEndTime, start),
        ),
        and(
          eq(bookingHolds.therapistId, proposed.therapist_id),
          lt(bookingHolds.serviceStartTime, end),
          gt(bookingHolds.serviceEndTime, start),
        ),
      ),
    ),
  );

  return rows.length > 0;
}

export async function createBookingWithResourceGuard(
  db: NodePgDatabase<any>,
  candidate: Phase4HCandidate,
  evaluateFn: (proposed: ResolvedPhase4HCandidate, ctx: HydratedBookingGuardContext) => any,
  bookingDataFn: (proposed: ResolvedPhase4HCandidate) => typeof bookings.$inferInsert,
) {
  const proposed = resolvePhase4HCandidate(candidate);
  if (!proposed) {
    return {
      success: false,
      conflictCode: "CONFLICT_CONTEXT_INCOMPLETE",
      validationResult: {
        allowed: false,
        conflictCode: "CONFLICT_CONTEXT_INCOMPLETE",
        reason: "Canonical resource/time context is incomplete",
        severity: "critical",
      },
    };
  }

  return db.transaction(async (tx: any) => {
    await acquireResourceLocks(tx, proposed.tenant_id, proposed.room_id, proposed.therapist_id);

    const txRepo = new SchedulingRepository(tx);
    const ctx = await txRepo.getBookingGuardContext(proposed.tenant_id, proposed.service_start_time);
    const validationResult = evaluateFn(proposed, ctx);
    if (!validationResult.allowed) {
      return { success: false, conflictCode: validationResult.conflictCode, validationResult };
    }

    if (await hasActiveConflictingHold(tx, proposed)) {
      return {
        success: false,
        conflictCode: "BOOKING_RESOURCE_CONFLICT",
        validationResult: {
          ...validationResult,
          allowed: false,
          conflictCode: "BOOKING_RESOURCE_CONFLICT",
          reason: "Resource is currently held by another request",
          severity: "critical",
        },
      };
    }

    const inserted = await tx.insert(bookings).values(bookingDataFn(proposed)).returning();
    return { success: true, booking: inserted[0], validationResult };
  });
}
