export interface AdminRoutePolicy {
  requestedResource: string;
  requestedAction: string;
  upstreamPath: string;
}

const PREFIX = "/api/admin/backend/v1";
const SAFE_ID = /^[A-Za-z0-9._~-]{1,128}$/;

export function resolveAdminRoutePolicy(method: string, rawUrl: string): AdminRoutePolicy | null {
  const url = new URL(rawUrl, "http://bff.invalid");
  if (!url.pathname.startsWith(PREFIX)) return null;
  const relative = url.pathname.slice(PREFIX.length) || "/";
  if (/%2f|%5c/i.test(relative)) return null;

  if (relative === "/services") {
    if (method === "GET") return { requestedResource: "SERVICES", requestedAction: "READ", upstreamPath: `/api/v1/services${url.search}` };
    if (method === "POST") return { requestedResource: "SERVICES", requestedAction: "CREATE", upstreamPath: `/api/v1/services${url.search}` };
    return null;
  }

  if (relative.startsWith("/services/")) {
    const id = relative.slice("/services/".length);
    if (!SAFE_ID.test(id)) return null;
    if (method === "PATCH") return { requestedResource: "SERVICES", requestedAction: "UPDATE", upstreamPath: `/api/v1/services/${id}${url.search}` };
    if (method === "DELETE") return { requestedResource: "SERVICES", requestedAction: "DELETE", upstreamPath: `/api/v1/services/${id}${url.search}` };
    return null;
  }

  if (relative === "/media/upload" && method === "POST") {
    return { requestedResource: "MEDIA", requestedAction: "UPLOAD", upstreamPath: `/api/v1/media/upload${url.search}` };
  }

  return null;
}
