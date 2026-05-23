export class AuthError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const ERR_UNAUTHORIZED = () => new AuthError("Unauthorized", "ERR_UNAUTHORIZED", 401);
export const ERR_FORBIDDEN = () => new AuthError("Forbidden", "ERR_FORBIDDEN", 403);
export const ERR_TENANT_SCOPE_REQUIRED = () => new AuthError("Tenant scope required", "ERR_TENANT_SCOPE_REQUIRED", 403);
export const ERR_INVALID_CONFIGURATION = () => new AuthError("Invalid auth configuration", "ERR_INVALID_CONFIGURATION", 500);
