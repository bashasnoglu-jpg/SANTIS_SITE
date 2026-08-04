import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { evaluateRequest, type AppConfig } from "./app.js";

const MAX_BODY_BYTES = 512 * 1024;

function loadConfig(): AppConfig {
  return {
    mode: process.env.AI_REVIEW_MODE ?? "",
    projectId: process.env.GCP_PROJECT_ID ?? "",
    region: process.env.GCP_REGION ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    kmsKeyVersion: process.env.EVIDENCE_KMS_KEY_VERSION ?? "",
    repositoryId: process.env.GITHUB_REPOSITORY_ID ?? "",
    ownerId: process.env.GITHUB_REPOSITORY_OWNER_ID ?? ""
  };
}

function respond(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("REQUEST_BODY_TOO_LARGE");
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const config = loadConfig();
const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/healthz") {
    respond(response, 200, {
      status: "ok",
      mode: config.mode === "shadow" ? "shadow" : "invalid"
    });
    return;
  }
  if (request.method !== "POST" || request.url !== "/v1/reviews/evaluate") {
    respond(response, 404, { error: "NOT_FOUND" });
    return;
  }

  try {
    const result = await evaluateRequest(await readJson(request), config);
    respond(response, result.status, result.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_JSON";
    respond(response, message === "REQUEST_BODY_TOO_LARGE" ? 413 : 400, {
      error: message === "REQUEST_BODY_TOO_LARGE" ? message : "INVALID_JSON"
    });
  }
});

const port = Number(process.env.PORT ?? "8080");
server.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ event: "server_started", port, mode: config.mode }));
});
