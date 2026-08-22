const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export interface ServiceIdentityProvider {
  authorizationHeader(): string;
}

/**
 * Runtime injects the short-lived workload identity JWT. The BFF never mints,
 * persists, logs, or exposes this token to the browser. WP2 remains the verifier.
 */
export class InjectedWifJwtProvider implements ServiceIdentityProvider {
  authorizationHeader(): string {
    const token = process.env.BFF_WIF_IDENTITY_TOKEN?.trim();
    if (!token) throw new Error("ERR_MISSING_BFF_WIF_IDENTITY_TOKEN");
    if (!JWT_PATTERN.test(token)) throw new Error("ERR_INVALID_BFF_WIF_IDENTITY_TOKEN");
    return `Bearer ${token}`;
  }
}
