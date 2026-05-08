# CoreState Single Source of Truth (SSOT)

Santis OS relies on a strictly managed state engine.

## Principles
- **CoreState is the only source of truth**: No other state managers, Context API abuses, or local state should replace CoreState for domain data.
- **No duplicated state**: Do not store the same data in multiple places. Derive state whenever possible.
- **No shadow state**: Ensure there is no hidden state in the DOM or UI components that contradicts CoreState.
- **No alternative stores without approval**: Any proposal for a new state system is strictly prohibited unless explicitly approved in the Boardroom.
- **Every transition must be deterministic**: All changes to the state must follow predictable, event-driven pathways.
