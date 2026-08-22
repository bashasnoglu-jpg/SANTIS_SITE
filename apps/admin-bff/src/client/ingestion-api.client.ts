import type { AdminBffConfig } from "../config.js";
import type { ServiceIdentityProvider } from "../identity/service-identity.provider.js";

export interface IngestionResponse {
  status: number;
  body: unknown;
}

function parseResponseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export class IngestionApiClient {
  constructor(
    private readonly config: AdminBffConfig,
    private readonly identity: ServiceIdentityProvider,
  ) {}

  private async post(path: string, body: unknown, rawSessionToken?: string): Promise<IngestionResponse> {
    const url = new URL(path, `${this.config.ingestionApiInternalUrl.origin}/`);
    const headers: Record<string, string> = {
      authorization: this.identity.authorizationHeader(),
      "content-type": "application/json",
      accept: "application/json",
    };
    if (rawSessionToken) headers["x-santis-session"] = rawSessionToken;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new Error("ERR_INGESTION_API_UNAVAILABLE", { cause: error });
    }

    return {
      status: response.status,
      body: parseResponseBody(await response.text()),
    };
  }

  login(email: string, password: string): Promise<IngestionResponse> {
    return this.post("/v1/auth/admin/login", { email, password });
  }

  verify(
    rawSessionToken: string,
    request: {
      request_id: string;
      requested_resource: string;
      requested_action: string;
      requested_tenant_id: string;
      requested_location_id?: string;
    },
  ): Promise<IngestionResponse> {
    return this.post("/v1/auth/admin/verify", request, rawSessionToken);
  }

  logout(rawSessionToken: string): Promise<IngestionResponse> {
    return this.post("/v1/auth/admin/logout", {}, rawSessionToken);
  }
}
