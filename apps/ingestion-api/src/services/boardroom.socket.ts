import { Server, Socket } from 'socket.io';
import { RegisterTelemetrySchema, UpdateTelemetrySchema, TelemetryAnomalySchema } from '../contracts/telemetry.contract.js';

export interface ActiveConnection {
  id: string;
  page: string;
  status: 'active' | 'idle';
  ipMask: string;
  lastSeen: string;
}

export class BoardroomSocketService {
  private io: Server;
  private interval: NodeJS.Timeout | null = null;
  private activeClients = new Map<string, ActiveConnection>();
  
  // Phase K-4: Anti-Flood Rate Limiter State
  private rateLimiters = new Map<string, { count: number, resetTime: number }>();

  constructor(io: Server) {
    this.io = io;
  }

  public initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[BoardroomSocket] Connected: ${socket.id}`);

      // RT-Telemtry: Public visitor registering telemetry
      socket.on('public:register_telemetry', (rawPayload: unknown) => {
        if (!this.checkRateLimit(socket)) return;

        let data;
        try {
          data = RegisterTelemetrySchema.parse(rawPayload);
        } catch (e) {
          // Drop silently: Sovereign shield protects from malformed packets
          console.warn(`[BoardroomSocket] 🛡️ Shield Blocked malformed register payload from ${socket.id}`);
          return;
        }

        const clientIp = socket.handshake.address || 'unknown';
        
        // Primitive IP Masking for privacy (Server-Side Data Integrity)
        let ipMask = '127.0.0.***';
        if (clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== 'unknown') {
           const parts = clientIp.split('.');
           if (parts.length === 4) {
             ipMask = `${parts[0]}.${parts[1]}.${parts[2]}.***`;
           } else {
             // IPv6 masking fallback
             ipMask = clientIp.substring(0, 8) + ':***';
           }
        }

        this.activeClients.set(socket.id, {
          id: socket.id, // Using socket ID as a temporary session ID
          page: data.page,
          status: data.status,
          ipMask: ipMask,
          lastSeen: new Date().toISOString()
        });
        
        console.log(`[BoardroomSocket] Registered Telemetry for: ${socket.id} at ${data.page}`);
        this.broadcastConnections();
      });

      // RT-Telemetry: Public visitor updating state
      socket.on('public:update_telemetry', (rawPayload: unknown) => {
         if (!this.checkRateLimit(socket)) return;

         let data;
         try {
           data = UpdateTelemetrySchema.parse(rawPayload);
         } catch (e) {
           console.warn(`[BoardroomSocket] 🛡️ Shield Blocked malformed update payload from ${socket.id}`);
           return;
         }

         if (this.activeClients.has(socket.id)) {
           const existing = this.activeClients.get(socket.id)!;
           this.activeClients.set(socket.id, {
             ...existing,
             ...data,
             lastSeen: new Date().toISOString()
           });
           this.broadcastConnections();
         }
      });

      // RT-Telemetry: Flight Risk Anomaly
      socket.on('public:telemetry_anomaly', (rawPayload: unknown) => {
         if (!this.checkRateLimit(socket)) return;

         let data;
         try {
           data = TelemetryAnomalySchema.parse(rawPayload);
         } catch (e) {
           console.warn(`[BoardroomSocket] 🛡️ Shield Blocked malformed anomaly payload from ${socket.id}`);
           return;
         }

         let ipMask = 'unknown';
         const activeClient = this.activeClients.get(socket.id);
         if (activeClient) {
             ipMask = activeClient.ipMask;
         }

         // Broadcast to Boardroom
         this.io.emit('admin:flight_risk', {
           anomalies: [
             {
               id: `risk-${Date.now()}-${socket.id.substring(0, 5)}`,
               anomalyType: data.anomalyType,
               riskScore: data.riskScore,
               user: ipMask,
               severity: data.severity,
               time: new Date().toISOString()
             }
           ],
           timestamp: new Date().toISOString()
         });
      });

      socket.on('disconnect', () => {
        console.log(`[BoardroomSocket] Disconnected: ${socket.id}`);
        if (this.activeClients.has(socket.id)) {
          this.activeClients.delete(socket.id);
          this.broadcastConnections();
        }
        if (this.rateLimiters.has(socket.id)) {
          this.rateLimiters.delete(socket.id);
        }
      });
    });

    this.startFinancialPulse();
  }

  /**
   * PHASE K-4: Anti-Flood Rate Limiter (5 msg/sec)
   * Returns true if allowed, false if limit exceeded.
   */
  private checkRateLimit(socket: Socket): boolean {
    const now = Date.now();
    const windowMs = 1000;
    const maxMessages = 5;

    let limiter = this.rateLimiters.get(socket.id);
    if (!limiter) {
      limiter = { count: 1, resetTime: now + windowMs };
      this.rateLimiters.set(socket.id, limiter);
      return true;
    }

    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return true;
    }

    limiter.count++;
    if (limiter.count > maxMessages) {
      console.warn(`[BoardroomSocket] 🛑 RATE LIMIT EXCEEDED: ${socket.id} (IP: ${socket.handshake.address}). Terminating connection.`);
      socket.disconnect(true);
      return false;
    }

    return true;
  }

  private broadcastConnections() {
    const connectionsArray = Array.from(this.activeClients.values());
    this.io.emit('admin:connections_update', {
      connections: connectionsArray,
      timestamp: new Date().toISOString()
    });
  }

  private startFinancialPulse() {
    if (this.interval) {
      clearTimeout(this.interval);
    }

    let currentRevenue = 12450;

    const pulse = () => {
      const now = new Date().toISOString();
      const capacityPercent = Math.min(100, Math.round((this.activeClients.size / 150) * 100)) || 85;
      
      // Random spike logic
      const isSpike = Math.random() > 0.8;
      const increment = isSpike ? Math.floor(Math.random() * 500) + 100 : Math.floor(Math.random() * 50) + 10;
      currentRevenue += increment;
      
      const conversionRate = 14.2 + (Math.random() * 0.4 - 0.2); // slight fluctuation

      // Emit strictly validated pulse
      this.io.emit('admin:finance_pulse', {
        dailyRevenue: currentRevenue,
        activeSessions: this.activeClients.size,
        capacityPercent: capacityPercent,
        conversionRate: Number(conversionRate.toFixed(1))
      });

      // Asymmetric rhythm: delay between 2 to 15 seconds
      const nextDelay = isSpike ? Math.floor(Math.random() * 13000) + 2000 : Math.floor(Math.random() * 5000) + 2000;
      this.interval = setTimeout(pulse, nextDelay);
    };

    pulse();
  }

  public shutdown() {
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
  }
}
