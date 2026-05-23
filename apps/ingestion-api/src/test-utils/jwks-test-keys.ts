import { generateKeyPair, exportJWK, SignJWT, KeyLike } from "jose";
import http from "node:http";
import type { AddressInfo } from "node:net";

export class TestJwksServer {
  private server: http.Server;
  private privateKey!: KeyLike;
  public publicKey!: KeyLike;
  public kid: string = "test-key-id";
  public url!: string;

  constructor() {
    this.server = http.createServer(async (req, res) => {
      if (req.url === "/auth/v1/.well-known/jwks.json") {
        const jwk = await exportJWK(this.publicKey);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            keys: [{ ...jwk, kid: this.kid, alg: "RS256", use: "sig" }],
          })
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }

  public async start(): Promise<void> {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    this.publicKey = publicKey;
    this.privateKey = privateKey;

    return new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", () => {
        const addr = this.server.address() as AddressInfo;
        this.url = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public async signToken(payload: any, issuer: string, audience?: string): Promise<string> {
    const jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256", kid: this.kid })
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime("2h");

    if (audience) {
      jwt.setAudience(audience);
    }

    return await jwt.sign(this.privateKey);
  }
}
