import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type WebSocket from "ws";
import { RoomStore, type PeerCapabilities, type PeerRole, type PeerSession, type TopologyMode } from "./room-store.js";

export const EVT = {
  HELLO: "hello",
  AUTH: "auth",
  AUTH_OK: "auth_ok",
  JOIN_ROOM: "join_room",
  PEER_SNAPSHOT: "peer_snapshot",
  PEER_JOINED: "peer_joined",
  PEER_LEFT: "peer_left",
  SIGNAL_OFFER: "signal_offer",
  SIGNAL_ANSWER: "signal_answer",
  SIGNAL_ICE: "signal_ice",
  RELAY_OFFER: "relay_offer",
  RELAY_ANSWER: "relay_answer",
  RELAY_ICE: "relay_ice",
  HEARTBEAT: "heartbeat",
  ACK: "ack",
  ERROR: "error"
} as const;

type EventType = (typeof EVT)[keyof typeof EVT];

interface Envelope<T = unknown> {
  t: EventType | string;
  rid?: string;
  sid?: string;
  pid?: string;
  ts: number;
  seq?: number;
  d?: T;
}

interface HelloPayload {
  clientVersion: string;
  roleHint?: PeerRole;
  panelId: string;
  deviceClass?: "desktop" | "tablet" | "mobile";
}

interface AuthPayload {
  token: string;
}

interface JoinRoomPayload {
  roomId: string;
  desiredTopology?: TopologyMode;
  capabilities: PeerCapabilities;
}

interface SignalPayload {
  toPeerId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface HeartbeatPayload {
  rttHint?: number;
}

interface TokenClaims {
  sub: string;
  clearance: number;
  role: PeerRole;
  exp: number;
}

type JsonMap = Record<string, unknown>;

function isObject(value: unknown): value is JsonMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nowMs(): number {
  return Date.now();
}

function safeJsonParse(raw: Buffer): unknown {
  return JSON.parse(raw.toString("utf8"));
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

/**
 * Dev token format:
 * base64url(jsonPayload).base64url(hmac_sha256(payload, secret))
 *
 * payload example:
 * {
 *   "sub":"user_42",
 *   "clearance":9,
 *   "role":"commander",
 *   "exp":1893456000
 * }
 */
export function verifySessionToken(token: string, secret: string): TokenClaims {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    throw new Error("Malformed token");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(payloadPart)
    .digest();

  const actualSignature = fromBase64Url(signaturePart);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error("Invalid signature");
  }

  const payloadBuf = fromBase64Url(payloadPart);
  const parsed = JSON.parse(payloadBuf.toString("utf8")) as Partial<TokenClaims>;

  if (
    typeof parsed.sub !== "string" ||
    typeof parsed.clearance !== "number" ||
    typeof parsed.role !== "string" ||
    typeof parsed.exp !== "number"
  ) {
    throw new Error("Invalid payload");
  }

  if (parsed.exp * 1000 <= Date.now()) {
    throw new Error("Token expired");
  }

  if (!["observer", "editor", "commander"].includes(parsed.role)) {
    throw new Error("Invalid role");
  }

  return parsed as TokenClaims;
}

export function createDevToken(claims: TokenClaims, secret: string): string {
  const payload = toBase64Url(JSON.stringify(claims));
  const signature = createHmac("sha256", secret).update(payload).digest();
  return `${payload}.${toBase64Url(signature)}`;
}

export interface WsRouterOptions {
  roomStore: RoomStore;
  signalingSecret: string;
}

export interface ConnectionContext {
  remoteAddress?: string;
}

export class WsRouter {
  private readonly roomStore: RoomStore;
  private readonly signalingSecret: string;
  private readonly sessions = new Map<WebSocket, PeerSession>();

  constructor(options: WsRouterOptions) {
    this.roomStore = options.roomStore;
    this.signalingSecret = options.signalingSecret;
  }

  onConnection(ws: WebSocket, req: IncomingMessage) {
    const remoteAddress = req.socket.remoteAddress;

    ws.on("message", (raw, isBinary) => {
      if (isBinary) {
        this.sendError(ws, "BINARY_NOT_ALLOWED", "Use JSON events on control plane");
        return;
      }

      try {
        const parsed = safeJsonParse(raw as Buffer);
        this.routeMessage(ws, parsed);
      } catch (error) {
        this.sendError(
          ws,
          "BAD_JSON",
          error instanceof Error ? error.message : "Invalid JSON"
        );
      }
    });

    ws.on("close", () => {
      this.cleanupSession(ws, "disconnect");
    });

    ws.on("error", () => {
      this.cleanupSession(ws, "disconnect");
    });

    const provisional: PeerSession = {
      sessionId: "",
      peerId: `peer_${randomUUID()}`,
      ws,
      role: "observer",
      clearance: 0,
      authenticated: false,
      joinedAt: 0,
      lastSeenAt: nowMs(),
      expiresAt: 0,
      capabilities: {
        webrtc: false,
        dataChannel: false,
        binaryTelemetry: false,
      },
      remoteAddress,
    };

    this.sessions.set(ws, provisional);
  }

  private routeMessage(ws: WebSocket, parsed: unknown) {
    if (!isObject(parsed)) {
      this.sendError(ws, "BAD_PAYLOAD", "Envelope must be an object");
      return;
    }

    const t = parsed.t;
    if (typeof t !== "string") {
      this.sendError(ws, "BAD_EVENT", "Missing event type");
      return;
    }

    switch (t) {
      case EVT.HELLO:
        this.handleHello(ws, parsed as Envelope<HelloPayload>);
        return;

      case EVT.AUTH:
        this.handleAuth(ws, parsed as Envelope<AuthPayload>);
        return;

      case EVT.JOIN_ROOM:
        this.handleJoinRoom(ws, parsed as Envelope<JoinRoomPayload>);
        return;

      case EVT.SIGNAL_OFFER:
      case EVT.SIGNAL_ANSWER:
      case EVT.SIGNAL_ICE:
        this.handleSignal(ws, parsed as Envelope<SignalPayload>);
        return;

      case EVT.HEARTBEAT:
        this.handleHeartbeat(ws, parsed as Envelope<HeartbeatPayload>);
        return;

      default:
        this.sendError(ws, "UNKNOWN_EVENT", `Unknown event: ${t}`);
    }
  }

  private handleHello(ws: WebSocket, msg: Envelope<HelloPayload>) {
    const session = this.sessions.get(ws);
    if (!session) {
      this.sendError(ws, "NO_SESSION", "No provisional session");
      return;
    }

    const payload = msg.d;
    if (!payload || typeof payload.clientVersion !== "string" || typeof payload.panelId !== "string") {
      this.sendError(ws, "BAD_HELLO", "Invalid hello payload");
      return;
    }

    session.clientVersion = payload.clientVersion;
    session.panelId = payload.panelId;
    session.role = payload.roleHint ?? "observer";
    session.lastSeenAt = nowMs();

    this.send(ws, {
      t: EVT.ACK,
      ts: nowMs(),
      pid: session.peerId,
      d: {
        ok: true,
        stage: "hello"
      }
    });
  }

  private handleAuth(ws: WebSocket, msg: Envelope<AuthPayload>) {
    const session = this.sessions.get(ws);
    if (!session) {
      this.sendError(ws, "NO_SESSION", "No provisional session");
      return;
    }

    if (!msg.d || typeof msg.d.token !== "string") {
      this.sendError(ws, "BAD_AUTH", "Missing auth token");
      return;
    }

    try {
      const claims = verifySessionToken(msg.d.token, this.signalingSecret);

      session.sessionId = `sess_${randomUUID()}`;
      session.userId = claims.sub;
      session.clearance = claims.clearance;
      session.role = claims.role;
      session.expiresAt = claims.exp * 1000;
      session.authenticated = true;
      session.lastSeenAt = nowMs();

      this.send(ws, {
        t: EVT.AUTH_OK,
        ts: nowMs(),
        sid: session.sessionId,
        pid: session.peerId,
        d: {
          sessionId: session.sessionId,
          peerId: session.peerId,
          clearance: session.clearance,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      this.sendError(
        ws,
        "AUTH_FAIL",
        error instanceof Error ? error.message : "Auth failed",
        true
      );
    }
  }

  private handleJoinRoom(ws: WebSocket, msg: Envelope<JoinRoomPayload>) {
    const session = this.sessions.get(ws);
    if (!session) {
      this.sendError(ws, "NO_SESSION", "No session");
      return;
    }

    if (!session.authenticated) {
      this.sendError(ws, "UNAUTH", "auth required");
      return;
    }

    const payload = msg.d;
    if (!payload || typeof payload.roomId !== "string" || !isObject(payload.capabilities)) {
      this.sendError(ws, "BAD_JOIN_ROOM", "Invalid join_room payload");
      return;
    }

    const capabilities: PeerCapabilities = {
      webrtc: Boolean(payload.capabilities.webrtc),
      dataChannel: Boolean(payload.capabilities.dataChannel),
      binaryTelemetry: Boolean(payload.capabilities.binaryTelemetry),
    };

    session.roomId = payload.roomId;
    session.joinedAt = nowMs();
    session.lastSeenAt = nowMs();
    session.capabilities = capabilities;

    const room = this.roomStore.upsertPeer(
      payload.roomId,
      session,
      payload.desiredTopology ?? "sparse"
    );

    this.send(ws, {
      t: EVT.PEER_SNAPSHOT,
      ts: nowMs(),
      rid: room.roomId,
      pid: session.peerId,
      d: {
        roomId: room.roomId,
        peers: this.roomStore.listPeerSnapshot(room.roomId, session.peerId)
      }
    });

    this.broadcast(room.roomId, {
      t: EVT.PEER_JOINED,
      ts: nowMs(),
      rid: room.roomId,
      pid: session.peerId,
      d: {
        peerId: session.peerId,
        role: session.role,
        clearance: session.clearance
      }
    }, session.peerId);
  }

  private handleSignal(ws: WebSocket, msg: Envelope<SignalPayload>) {
    const session = this.sessions.get(ws);
    if (!session) {
      this.sendError(ws, "NO_SESSION", "No session");
      return;
    }

    if (!session.authenticated || !session.roomId) {
      this.sendError(ws, "NO_ROOM", "join_room required");
      return;
    }

    const payload = msg.d;
    if (!payload || typeof payload.toPeerId !== "string") {
      this.sendError(ws, "BAD_SIGNAL", "Missing toPeerId");
      return;
    }

    const target = this.roomStore.findPeer(session.roomId, payload.toPeerId);
    if (!target) {
      this.sendError(ws, "PEER_NOT_FOUND", "Target peer missing");
      return;
    }

    const relayType =
      msg.t === EVT.SIGNAL_OFFER
        ? EVT.RELAY_OFFER
        : msg.t === EVT.SIGNAL_ANSWER
          ? EVT.RELAY_ANSWER
          : EVT.RELAY_ICE;

    this.send(target.ws, {
      t: relayType,
      ts: nowMs(),
      rid: session.roomId,
      pid: session.peerId,
      sid: session.sessionId,
      d: payload
    });

    this.send(ws, {
      t: EVT.ACK,
      ts: nowMs(),
      rid: session.roomId,
      pid: session.peerId,
      d: {
        ok: true,
        stage: relayType
      }
    });
  }

  private handleHeartbeat(ws: WebSocket, _msg: Envelope<HeartbeatPayload>) {
    const session = this.sessions.get(ws);
    if (!session) {
      this.sendError(ws, "NO_SESSION", "No session");
      return;
    }

    session.lastSeenAt = nowMs();

    this.send(ws, {
      t: EVT.ACK,
      ts: nowMs(),
      pid: session.peerId,
      sid: session.sessionId,
      d: {
        ok: true,
        stage: "heartbeat"
      }
    });
  }

  sweepDeadPeers(timeoutMs: number) {
    const removed = this.roomStore.sweepDeadPeers(nowMs(), timeoutMs);

    for (const { roomId, peer } of removed) {
      this.sessions.delete(peer.ws);

      try {
        if (peer.ws.readyState === peer.ws.OPEN) {
          peer.ws.close(4000, "heartbeat_timeout");
        }
      } catch {
        // no-op
      }

      this.broadcast(roomId, {
        t: EVT.PEER_LEFT,
        ts: nowMs(),
        rid: roomId,
        pid: peer.peerId,
        d: {
          peerId: peer.peerId,
          reason: "timeout"
        }
      }, peer.peerId);
    }
  }

  private cleanupSession(ws: WebSocket, reason: "disconnect" | "timeout" | "kicked") {
    const session = this.sessions.get(ws);
    if (!session) return;

    this.sessions.delete(ws);

    if (session.roomId) {
      const removed = this.roomStore.removePeer(session.roomId, session.peerId);
      if (removed) {
        this.broadcast(session.roomId, {
          t: EVT.PEER_LEFT,
          ts: nowMs(),
          rid: session.roomId,
          pid: session.peerId,
          d: {
            peerId: session.peerId,
            reason
          }
        }, session.peerId);
      }
    }
  }

  private broadcast(roomId: string, payload: unknown, exceptPeerId?: string) {
    this.roomStore.forEachPeer(roomId, (peer) => {
      if (peer.peerId === exceptPeerId) return;
      this.send(peer.ws, payload);
    });
  }

  private send(ws: WebSocket, payload: unknown) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  private sendError(ws: WebSocket, code: string, message: string, fatal = false) {
    this.send(ws, {
      t: EVT.ERROR,
      ts: nowMs(),
      d: {
        code,
        message,
        fatal
      }
    });

    if (fatal) {
      try {
        ws.close(4001, code);
      } catch {
        // no-op
      }
    }
  }
}
