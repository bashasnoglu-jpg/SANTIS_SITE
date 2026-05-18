# Runtime Contracts & Validation

This rule guarantees data integrity across boundaries in Santis OS.

## Principles
- **Zod at all boundaries**: Every API request, response, and event payload must be validated using Zod schemas.
- **SSE patches require seq and ts**: Server-Sent Events must include sequence numbers and timestamps to ensure ordering and truth streaming.
- **Reject malformed payloads**: Any data that fails Zod validation must be immediately rejected at the boundary. No partial or corrupted data should enter the system.
- **No unvalidated external input**: All user input, webhook data, and external API responses must be sanitized and validated before use.
