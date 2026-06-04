import { FastifyInstance } from 'fastify';

export async function streamRoutes(server: FastifyInstance) {

  // 1. Live Intent Radar SSE
  server.get('/v1/stream/events', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    reply.raw.write('event: connected\n');
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now(), source: 'santis-stream-rt2b-mock' })}\n\n`);

    const interval = setInterval(() => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', ts: Date.now() })}\n\n`);
    }, 10000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  // 2. God Mode Stream SSE
  server.get('/v1/streams/god', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    reply.raw.write(`data: ${JSON.stringify({ eventType: 'system.status', status: 'ONLINE', ts: Date.now() })}\n\n`);

    const interval = setInterval(() => {
      reply.raw.write('data: \n\n'); // Empty heartbeat string expected by frontend
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  // 3. Oracle Live SSE
  server.get('/v1/streams/oracle', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    reply.raw.write(`event: oracle_ready\n`);
    reply.raw.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);

    const interval = setInterval(() => {
      reply.raw.write('event: heartbeat\n');
      reply.raw.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    }, 10000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  // 4. Advisor Debug Stream SSE
  server.get('/v1/stream/advisor', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    reply.raw.write(`event: connected\n`);
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);

    // @ts-ignore
    const bus = server.bus;
    
    // Subscribe to bus
    const unsubscribe = bus?.events.subscribe('advisor.intent.evaluated', (evt: any) => {
      reply.raw.write(`event: advisor_evaluated\n`);
      reply.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
    });

    const interval = setInterval(() => {
      reply.raw.write('event: heartbeat\n');
      reply.raw.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    }, 10000);

    request.raw.on('close', () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    });
  });
}
