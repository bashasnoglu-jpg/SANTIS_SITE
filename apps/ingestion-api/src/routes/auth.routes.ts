import { Router, Request, Response } from "express";
import crypto from "crypto";
import { signSessionToken, verifySessionToken } from "../security/crypto-token";

export const authRouter: Router = Router();

authRouter.get("/session", (req: Request, res: Response) => {
  try {
    const sessionId = crypto.randomUUID();
    
    const token = signSessionToken({
      sessionId,
      role: "guest",
    });

    res.json({
      status: "success",
      token,
      sessionId,
      role: "guest",
    });
  } catch (error) {
    console.error("🚨 [Auth Routes] Failed to generate session token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/v1/auth/ws-token
 * [SEC-02] Short-lived WebSocket token endpoint.
 *
 * Sabit "SANTIS-CORE-TX99" token'ının yerine geçer.
 * Caller, mevcut oturum token'ını Authorization: Bearer <token> ile gönderir.
 * Sunucu doğrular, operator rolünü onaylar ve 5 dakika geçerli yeni bir WS token üretir.
 *
 * TTL 5 dk — bağlantı kurulmadan hemen önce çağrılmalı, cache'lenmemeli.
 */
authRouter.post("/ws-token", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const callerToken = authHeader.split(" ")[1];
    let callerPayload;
    try {
      callerPayload = verifySessionToken(callerToken);
    } catch {
      res.status(403).json({ error: "Invalid or expired session token" });
      return;
    }

    // Sadece operator ve admin WS bağlantısı kurabilir
    if (callerPayload.role !== "operator" && callerPayload.role !== "admin") {
      res.status(403).json({ error: "Forbidden: operator role required" });
      return;
    }

    // 5 dakika TTL — kısa ömürlü, tek kullanım niyetiyle
    const wsToken = signSessionToken({
      sessionId: crypto.randomUUID(), // Fresh session ID — önceki ile bağı yok
      role: callerPayload.role,
    });

    res.json({
      token: wsToken,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error("🚨 [Auth Routes] Failed to generate WS token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

