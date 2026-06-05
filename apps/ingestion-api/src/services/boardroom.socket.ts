import { Server, Socket } from 'socket.io';

export class BoardroomSocketService {
  private io: Server;
  private interval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
  }

  public initialize() {
    this.io.on('connection', (socket: Socket) => {
      // Deterministic client connection log
      console.log(`[BoardroomSocket] Connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[BoardroomSocket] Disconnected: ${socket.id}`);
      });
    });

    this.startDeterministicProducer();
  }

  private startDeterministicProducer() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // 10-second tick loop to emit live deterministic data
    this.interval = setInterval(() => {
      const now = new Date().toISOString();

      // 1. Finance Update Schema Compatible payload
      this.io.emit('admin:finance_update', {
        liveRevenue: 15400,
        activeSessions: 3,
        timestamp: now
      });

      // 2. Active Connections Schema Compatible payload
      this.io.emit('admin:connections_update', {
        connections: [
          {
            id: 'usr-001-live',
            page: '/spa/hamam',
            status: 'active',
            ipMask: '192.168.1.***',
            lastSeen: now
          },
          {
            id: 'usr-002-live',
            page: '/booking/checkout',
            status: 'idle',
            ipMask: '88.242.10.***',
            lastSeen: now
          }
        ],
        timestamp: now
      });

      // 3. Flight Risk Schema Compatible payload
      this.io.emit('admin:flight_risk', {
        anomalies: [
          {
            id: 'risk-1006-live',
            type: 'code_1006',
            user: 'guest-01-live',
            detail: 'WebSocket Drop',
            severity: 'critical',
            time: now
          },
          {
            id: 'risk-soft-live',
            type: 'soft_risk',
            user: 'guest-09-live',
            detail: 'Idle on Checkout (3m)',
            severity: 'medium',
            time: now
          }
        ],
        timestamp: now
      });

    }, 10000);
  }

  public shutdown() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
