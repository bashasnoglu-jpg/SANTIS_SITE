import { Router, Request, Response } from "express";
import crypto from "crypto";
import { signSessionToken } from "../security/crypto-token";

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
