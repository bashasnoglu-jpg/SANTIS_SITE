# Canonical Stack

Santis OS enforces a strict, modern, and deterministic technology stack.

- **Package Manager**: pnpm only (npm and yarn are strictly forbidden).
- **Language**: TypeScript (strict mode, zero exceptions).
- **Module System**: Node ESM.
- **UI Framework**: React.
- **Validation**: Zod (for all boundaries and runtime contracts).
- **State Machine**: XState (for complex, deterministic workflows).
- **ORM**: Drizzle.
- **Database**: PostgreSQL.
- **Real-time**: SSE (Server-Sent Events) for truth streaming.
- **Animation**: Framer Motion / GSAP Observer (only when intentional, controlled, and cinematic).
