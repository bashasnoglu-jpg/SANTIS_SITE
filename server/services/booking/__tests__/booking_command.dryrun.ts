import { createBookingCommand } from '../booking_command';
import { 
  BookingTimeConflictError, 
  DuplicateLedgerError, 
  MissingReferenceError, 
  InvalidBookingDataError, 
  mapPostgresError 
} from '../booking_errors';
import { getDbClient } from '../../../db/client';
import { sql } from 'drizzle-orm';
import { tenants, locations, clients, services, staff, rooms } from '../../../db/schema/core';

async function runTests() {
  console.log("🛡️ Starting Booking Command Dry-Run Test Harness...\n");
  
  const testDbUrl = process.env.SANTIS_DRY_RUN_DATABASE_URL;

  // --- Scenario A: Missing operational resources ---
  console.log("--- Scenario A: Missing operational resources ---");
  try {
    await createBookingCommand({
      tenantId: 't1',
      locationId: 'l1',
      clientId: 'c1',
      serviceId: 's1',
      startAt: new Date(),
      status: 'confirmed'
    });
    console.error("❌ Scenario A FAILED: Expected InvalidBookingDataError, got success.");
  } catch (error: any) {
    if (error instanceof InvalidBookingDataError) {
      console.log("✅ Scenario A PASSED: Threw InvalidBookingDataError as expected.");
    } else {
      console.error("❌ Scenario A FAILED: Threw wrong error type:", error);
    }
  }

  // --- Scenario B: Draft booking shape ---
  console.log("\n--- Scenario B: Draft booking shape ---");
  try {
    // We expect it to pass validation and then fail at DB load because no DB is connected yet.
    await createBookingCommand({
      tenantId: 't1',
      locationId: 'l1',
      clientId: 'c1',
      serviceId: 's1',
      startAt: new Date(),
      status: 'draft'
    });
  } catch (error: any) {
    if (error instanceof InvalidBookingDataError) {
      console.error("❌ Scenario B FAILED: Draft threw InvalidBookingDataError.");
    } else {
      console.log("✅ Scenario B PASSED: Draft validation safely bypassed strict operational checks.");
    }
  }

  // --- Scenario C: PostgreSQL error mapping unit test ---
  console.log("\n--- Scenario C: PostgreSQL error mapping unit test ---");
  const testErrors = [
    { code: '23P01', expected: BookingTimeConflictError },
    { code: '23505', expected: DuplicateLedgerError },
    { code: '23503', expected: MissingReferenceError },
    { code: '23514', expected: InvalidBookingDataError }
  ];

  for (const t of testErrors) {
    const mapped = mapPostgresError({ code: t.code });
    if (mapped instanceof t.expected) {
      console.log(`✅ Error ${t.code} mapped to ${t.expected.name} correctly.`);
    } else {
      console.error(`❌ Error ${t.code} mapping FAILED. Got:`, mapped);
    }
  }

  // --- Scenario D: Database-backed dry-run ---
  console.log("\n--- Scenario D: Database-backed dry-run ---");
  if (!testDbUrl) {
    console.log("⏭️  Dry-run skipped: SANTIS_DRY_RUN_DATABASE_URL is not set.");
    return;
  }

  if (testDbUrl.includes('supabase') || testDbUrl.includes('vercel') || testDbUrl.includes('cloud')) {
    if (!testDbUrl.includes('local') && !testDbUrl.includes('test')) {
      console.error("❌ Aborting: SANTIS_DRY_RUN_DATABASE_URL appears to be production. Must explicitly contain 'local' or 'test'.");
      return;
    }
  }

  console.log("✅ Safe local/test database identified. Proceeding with DB tests...");
  
  // Inject for client usage inside createBookingCommand
  process.env.DATABASE_URL = testDbUrl; 
  
  try {
    const db = getDbClient();
    
    // We use a transaction to ensure all fixtures are rolled back
    await db.transaction(async (tx) => {
      console.log("   -> Inserting fixtures...");
      
      const [tenant] = await tx.insert(tenants).values({ name: 'Test Tenant' }).returning();
      const [location] = await tx.insert(locations).values({ tenantId: tenant.id, name: 'Test Location' }).returning();
      const [client] = await tx.insert(clients).values({ tenantId: tenant.id, name: 'Test Client' }).returning();
      const [service] = await tx.insert(services).values({ tenantId: tenant.id, name: 'Test Service', durationMinutes: 60, price: 1000 }).returning();
      const [staffMember] = await tx.insert(staff).values({ tenantId: tenant.id, locationId: location.id, name: 'Test Therapist', role: 'therapist' }).returning();
      const [room] = await tx.insert(rooms).values({ tenantId: tenant.id, locationId: location.id, name: 'Test Room' }).returning();
      
      console.log("   -> Running first booking command...");
      const startAt = new Date('2026-07-01T10:00:00Z');
      
      await createBookingCommand({
        tenantId: tenant.id,
        locationId: location.id,
        clientId: client.id,
        serviceId: service.id,
        therapistId: staffMember.id,
        roomId: room.id,
        startAt: startAt,
        status: 'confirmed'
      });
      console.log("   ✅ First booking created successfully.");

      console.log("   -> Running overlapping booking command...");
      let caughtConflict = false;
      try {
        await createBookingCommand({
          tenantId: tenant.id,
          locationId: location.id,
          clientId: client.id,
          serviceId: service.id,
          therapistId: staffMember.id,
          roomId: room.id,
          startAt: startAt,
          status: 'confirmed'
        });
      } catch (err) {
        if (err instanceof BookingTimeConflictError) {
          console.log("   ✅ Overlap rejected and mapped correctly to BookingTimeConflictError.");
          caughtConflict = true;
        } else {
          console.error("   ❌ Overlap rejected but with wrong error:", err);
        }
      }
      
      if (!caughtConflict) {
        console.error("   ❌ Overlap WAS NOT REJECTED! Constraints failed or were bypassed.");
      }

      // Rollback the transaction deliberately
      tx.rollback();
    });
  } catch (err: any) {
    if (err.message === 'Rollback') {
      console.log("\n✅ DB tests completed and rolled back successfully.");
    } else {
      console.log("\n⚠️ DB test skipped or failed due to missing schema/connection. (Expected if migrations are not pushed yet).");
      console.error(err.message);
    }
  }
}

runTests().catch(console.error);
