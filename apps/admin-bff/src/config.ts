export interface AdminBffConfig {
  adminPublicOrigin: string;
  adminBffUpstream: URL;
  ingestionApiInternalUrl: URL;
  requestedTenantId: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`ERR_MISSING_${name}`);
  return value;
}

function exactOrigin(name: string, requireHttps: boolean): URL {
  const raw = requiredEnv(name);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`ERR_INVALID_${name}`);
  }
  if ((requireHttps && url.protocol !== "https:") || (url.protocol !== "https:" && url.protocol !== "http:")) {
    throw new Error(`ERR_INVALID_${name}`);
  }
  if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new Error(`ERR_INVALID_${name}`);
  }
  return url;
}

export function loadConfig(): AdminBffConfig {
  const adminPublicOrigin = exactOrigin("ADMIN_PUBLIC_ORIGIN", true);
  const adminBffUpstream = exactOrigin("ADMIN_BFF_UPSTREAM", false);
  const ingestionApiInternalUrl = exactOrigin("INGESTION_API_INTERNAL_URL", false);
  const requestedTenantId = requiredEnv("ADMIN_REQUESTED_TENANT_ID");
  if (requestedTenantId === "*" || requestedTenantId.length > 128) {
    throw new Error("ERR_INVALID_ADMIN_REQUESTED_TENANT_ID");
  }

  return {
    adminPublicOrigin: adminPublicOrigin.origin,
    adminBffUpstream,
    ingestionApiInternalUrl,
    requestedTenantId,
  };
}
