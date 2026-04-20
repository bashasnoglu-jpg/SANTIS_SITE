# Secret Rotation and Env Migration

## Scope
This checklist hardens admin authentication and removes insecure fallback behavior.

## New Required Variables
- `ADMIN_SECRET_TOKEN` (min 24 chars, random)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` (bcrypt preferred)

## Optional Variables
- `ADMIN_PASSWORD` and `ADMIN_SALT` (only for SHA-256 mode)
- `SESSION_SECRET`
- `GEMINI_API_KEY`

## Legacy to New Key Mapping
- `ADMIN_USER` -> `ADMIN_USERNAME`
- `ADMIN_PASS_HASH` -> `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET` can be used temporarily for admin token fallback, but migrate to `ADMIN_SECRET_TOKEN`.

## Rotation Procedure
1. Generate a new admin token and session secret.
2. Generate a new bcrypt password hash for the admin password.
3. Update runtime secrets store (server, CI/CD, container platform).
4. Replace local `.env` values and remove legacy keys.
5. Restart application processes to invalidate old in-memory auth state.
6. Verify login, CSRF-protected writes, and token-auth requests.
7. Revoke old secrets in external systems (for example Gemini API keys).

## Bcrypt Hash Example
```powershell
@'
import bcrypt
pw = b"REPLACE_WITH_STRONG_PASSWORD"
print(bcrypt.hashpw(pw, bcrypt.gensalt()).decode())
'@ | python -
```

## Validation
Run:
```powershell
python tools/env_security_migration.py .env
```

The command fails with non-zero exit code when critical settings are missing or weak.
