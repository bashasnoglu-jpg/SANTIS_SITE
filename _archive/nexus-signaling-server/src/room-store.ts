import type { WebSocket } from "ws";

export type PeerRole = "observer" | "editor" | "commander";
export type TopologyMode = "mesh" | "sparse";

export interface PeerCapabilities {
  webrtc: boolean;
  dataChannel: boolean;
  binaryTelemetry: boolean;
}

export interface PeerSession {
  sessionId: string;
  peerId: string;
  userId?: string;
  ws: WebSocket;
  roomId?: string;
  role: PeerRole;
  clearance: number;
  authenticated: boolean;
  joinedAt: number;
  lastSeenAt: number;
  expiresAt: number;
  capabilities: PeerCapabilities;
  panelId?: string;
  clientVersion?: string;
  remoteAddress?: string;
}

export interface RoomState {
  roomId: string;
  createdAt: number;
  topology: TopologyMode;
  peers: Map<string, PeerSession>;
}

export class RoomStore {
  private readonly rooms = new Map<string, RoomState>();

  getOrCreate(roomId: string, topology: TopologyMode = "sparse"): RoomState {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;

    const room: RoomState = {
      roomId,
      createdAt: Date.now(),
      topology,
      peers: new Map<string, PeerSession>(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  upsertPeer(roomId: string, peer: PeerSession, topology?: TopologyMode): RoomState {
    const room = this.getOrCreate(roomId, topology ?? "sparse");
    room.peers.set(peer.peerId, peer);
    return room;
  }

  removePeer(roomId: string, peerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const existed = room.peers.delete(peerId);

    if (room.peers.size === 0) {
      this.rooms.delete(roomId);
    }

    return existed;
  }

  listPeerSnapshot(roomId: string, excludePeerId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return [...room.peers.values()]
      .filter((peer) => peer.peerId !== excludePeerId)
      .map((peer) => ({
        peerId: peer.peerId,
        role: peer.role,
        clearance: peer.clearance,
        joinedAt: peer.joinedAt,
        capabilities: peer.capabilities,
      }));
  }

  findPeer(roomId: string, peerId: string): PeerSession | undefined {
    return this.rooms.get(roomId)?.peers.get(peerId);
  }

  forEachPeer(roomId: string, cb: (peer: PeerSession) => void) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const peer of room.peers.values()) {
      cb(peer);
    }
  }

  sweepDeadPeers(
    now: number,
    timeoutMs: number,
  ): Array<{ roomId: string; peer: PeerSession }> {
    const removed: Array<{ roomId: string; peer: PeerSession }> = [];

    for (const [roomId, room] of this.rooms.entries()) {
      for (const [peerId, peer] of room.peers.entries()) {
        if (now - peer.lastSeenAt > timeoutMs) {
          room.peers.delete(peerId);
          removed.push({ roomId, peer });
        }
      }

      if (room.peers.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    return removed;
  }
}
