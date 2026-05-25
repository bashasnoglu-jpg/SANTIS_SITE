import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { boardroomAuthPreHandler, boardroomWriteAuthPreHandler } from '../auth/fastify-auth-prehandler.js';
import {
  SchedulingResourcesRequestSchema,
  AvailabilityRequestSchema,
  CreateBookingRequestSchema,
  ValidateBookingRequestSchema,
  HoldBookingRequestSchema
} from '@santis/domain-schema/scheduling.api.js';
import { calculateAvailability } from '@santis/domain-schema/scheduling.availability.js';
import { evaluateBooking } from '@santis/domain-schema/scheduling.booking-guard.js';
import {
  MOCK_SERVICES,
  MOCK_ROOMS,
  MOCK_THERAPISTS,
  MOCK_LOCATION,
  MOCK_SPA_AREA,
  MOCK_BOOKINGS,
  MOCK_SERVICE_ROOM_COMPATIBILITIES,
  MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
  MOCK_OPERATING_HOURS,
  MOCK_SHIFTS,
  MOCK_BLOCKERS
} from '@santis/domain-schema/scheduling.fixtures.js';

export const schedulingRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {

  // Middleware to ensure tenant scope is respected
  function validateTenantScope(requestTenantId: string | undefined, sessionTenantId: string) {
    if (requestTenantId && requestTenantId !== sessionTenantId) {
      throw { statusCode: 403, code: 'TENANT_SCOPE_VIOLATION', message: 'Requested tenant does not match session tenant' };
    }
  }

  // GET /api/v1/scheduling/resources -> Fetch static resources for now
  server.get('/v1/scheduling/resources', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const queryParsed = SchedulingResourcesRequestSchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.status(400).send({ error: "Invalid Query", details: queryParsed.error.errors });
      }

      validateTenantScope(queryParsed.data.tenant_id, tenantId);

      // Return MOCK data for K-4
      return reply.status(200).send({
        locations: [MOCK_LOCATION].filter(l => l.tenant_id === tenantId),
        spa_areas: [MOCK_SPA_AREA].filter(sa => sa.tenant_id === tenantId),
        rooms: MOCK_ROOMS.filter(r => r.tenant_id === tenantId),
        therapists: MOCK_THERAPISTS.filter(t => t.tenant_id === tenantId),
        services: MOCK_SERVICES.filter(s => s.tenant_id === tenantId)
      });
    } catch (error: any) {
      if (error.code === 'TENANT_SCOPE_VIOLATION') {
        return reply.status(403).send({ error: error.message, code: error.code });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // GET /api/v1/scheduling/availability
  server.get('/v1/scheduling/availability', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const queryParsed = AvailabilityRequestSchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.status(400).send({ error: "Invalid Query", details: queryParsed.error.errors });
      }

      validateTenantScope(queryParsed.data.tenant_id, tenantId);

      // Mock context hydration for K-4
      const ctx = {
        tenant_id: tenantId,
        target_date: queryParsed.data.date,
        service_id: queryParsed.data.service_id,
        spa_area_id: queryParsed.data.spa_area_id,
        locations: [MOCK_LOCATION],
        spa_areas: [MOCK_SPA_AREA],
        rooms: MOCK_ROOMS,
        therapists: MOCK_THERAPISTS,
        services: MOCK_SERVICES,
        room_compatibilities: MOCK_SERVICE_ROOM_COMPATIBILITIES,
        therapist_compatibilities: MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
        operating_hours: MOCK_OPERATING_HOURS,
        shifts: MOCK_SHIFTS,
        blockers: MOCK_BLOCKERS,
        bookings: MOCK_BOOKINGS
      };

      const slots = calculateAvailability(ctx);
      
      return reply.status(200).send({ slots });
    } catch (error: any) {
      if (error.code === 'TENANT_SCOPE_VIOLATION') {
        return reply.status(403).send({ error: error.message, code: error.code });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // GET /api/v1/scheduling/bookings -> Returns mock list
  server.get('/v1/scheduling/bookings', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      return reply.status(200).send({
        bookings: MOCK_BOOKINGS.filter(b => b.tenant_id === tenantId)
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // POST /api/v1/scheduling/bookings -> 501
  server.post('/v1/scheduling/bookings', { preHandler: boardroomWriteAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const bodyParsed = CreateBookingRequestSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({ error: "Invalid Body", details: bodyParsed.error.errors });
      }

      validateTenantScope(bodyParsed.data.tenant_id, tenantId);

      // K-4: explicitly return 501
      return reply.status(501).send({
        error: "Not Implemented",
        code: "NOT_IMPLEMENTED_TRANSACTION_REQUIRED",
        message: "Booking creation requires a DB transactional layer to prevent race conditions. Will be implemented in Phase K-5."
      });

    } catch (error: any) {
      if (error.code === 'TENANT_SCOPE_VIOLATION') {
        return reply.status(403).send({ error: error.message, code: error.code });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // POST /api/v1/scheduling/booking/validate -> Dry-run DB hydrated mock integration
  server.post('/v1/scheduling/booking/validate', { preHandler: boardroomWriteAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const bodyParsed = ValidateBookingRequestSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({ error: "Invalid Body", details: bodyParsed.error.errors });
      }

      validateTenantScope(bodyParsed.data.tenant_id, tenantId);

      const proposed = {
        tenant_id: tenantId,
        service_id: bodyParsed.data.service_id,
        room_id: bodyParsed.data.room_id,
        therapist_id: bodyParsed.data.therapist_id,
        service_start_time: bodyParsed.data.service_start_time,
        service_end_time: bodyParsed.data.service_end_time,
        cleanup_end_time: bodyParsed.data.cleanup_end_time,
      };

      let ctx;
      try {
        const db = (server as any).db;
        if (!db) throw new Error("DB instance not found on server");
        
        // Dynamically import to avoid breaking standard fastify loads if database package has issues
        const { SchedulingRepository } = await import('@santis/database');
        const repo = new SchedulingRepository(db);
        
        ctx = await repo.getBookingGuardContext(tenantId, proposed.service_start_time);
      } catch (hydrationError: any) {
        if (process.env.NODE_ENV === 'test') {
          // Explicit Mock Fallback for test mode
          ctx = {
            locations: [MOCK_LOCATION],
            spa_areas: [MOCK_SPA_AREA],
            rooms: MOCK_ROOMS,
            therapists: MOCK_THERAPISTS,
            services: MOCK_SERVICES,
            room_compatibilities: MOCK_SERVICE_ROOM_COMPATIBILITIES,
            therapist_compatibilities: MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
            operating_hours: MOCK_OPERATING_HOURS,
            shifts: MOCK_SHIFTS,
            blockers: MOCK_BLOCKERS,
            bookings: MOCK_BOOKINGS,
          };
        } else {
          // Production/Staging safe failure
          server.log.error(hydrationError);
          return reply.status(503).send({ 
            error: "Service Unavailable", 
            code: "DB_HYDRATION_FAILED",
            message: "Failed to hydrate scheduling context from database."
          });
        }
      }

      const result = evaluateBooking(proposed, ctx);

      return reply.status(200).send({
        allowed: result.allowed,
        conflictCode: result.conflictCode || null,
        reason: result.reason || null,
        severity: result.severity,
        affectedResource: result.affectedResource || null,
        decisionTrace: result.decisionTrace,
        alternatives: [],
        dryRun: true
      });
    } catch (error: any) {
      if (error.code === 'TENANT_SCOPE_VIOLATION') {
        return reply.status(403).send({ error: error.message, code: error.code });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // POST /api/v1/scheduling/booking/hold -> Mock/In-memory hold simulation
  server.post('/v1/scheduling/booking/hold', { preHandler: boardroomWriteAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const bodyParsed = HoldBookingRequestSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({ error: "Invalid Body", details: bodyParsed.error.errors });
      }

      validateTenantScope(bodyParsed.data.tenant_id, tenantId);

      const proposed = {
        tenant_id: tenantId,
        service_id: bodyParsed.data.service_id,
        room_id: bodyParsed.data.room_id,
        therapist_id: bodyParsed.data.therapist_id,
        service_start_time: bodyParsed.data.service_start_time,
        service_end_time: bodyParsed.data.service_end_time,
        cleanup_end_time: bodyParsed.data.cleanup_end_time,
      };

      let ctx;
      try {
        const db = (server as any).db;
        if (!db) throw new Error("DB instance not found on server");
        
        const { SchedulingRepository } = await import('@santis/database');
        const repo = new SchedulingRepository(db);
        
        ctx = await repo.getBookingGuardContext(tenantId, proposed.service_start_time);
      } catch (hydrationError: any) {
        if (process.env.NODE_ENV === 'test') {
          ctx = {
            locations: [MOCK_LOCATION],
            spa_areas: [MOCK_SPA_AREA],
            rooms: MOCK_ROOMS,
            therapists: MOCK_THERAPISTS,
            services: MOCK_SERVICES,
            room_compatibilities: MOCK_SERVICE_ROOM_COMPATIBILITIES,
            therapist_compatibilities: MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
            operating_hours: MOCK_OPERATING_HOURS,
            shifts: MOCK_SHIFTS,
            blockers: MOCK_BLOCKERS,
            bookings: MOCK_BOOKINGS,
          };
        } else {
          server.log.error(hydrationError);
          return reply.status(503).send({ 
            error: "Service Unavailable", 
            code: "DB_HYDRATION_FAILED",
            message: "Failed to hydrate scheduling context from database."
          });
        }
      }

      const validationResult = evaluateBooking(proposed, ctx);

      const validationEnvelope = {
        allowed: validationResult.allowed,
        conflictCode: validationResult.conflictCode || null,
        reason: validationResult.reason || null,
        severity: validationResult.severity,
        affectedResource: validationResult.affectedResource || null,
        decisionTrace: validationResult.decisionTrace,
        alternatives: [],
        dryRun: true as const
      };

      if (!validationResult.allowed) {
        return reply.status(409).send({
          held: false,
          status: 'validation_failed',
          validation: validationEnvelope,
          dryRun: true
        });
      }

      // Valid - create mock hold
      const crypto = await import('crypto');
      const holdId = crypto.randomUUID();
      const holdToken = crypto.randomBytes(32).toString('hex');
      const ttlSeconds = 600; // 10 minutes
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

      return reply.status(200).send({
        held: true,
        holdId,
        holdToken,
        status: 'active',
        expiresAt,
        ttlSeconds,
        validation: validationEnvelope,
        dryRun: true
      });
    } catch (error: any) {
      if (error.code === 'TENANT_SCOPE_VIOLATION') {
        return reply.status(403).send({ error: error.message, code: error.code });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

};
