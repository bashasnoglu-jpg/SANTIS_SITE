# Zero Technical Debt

Santis OS enforces a zero-tolerance policy for technical debt and codebase drift.

## Principles
- **Auditable technical debt**: Technical debt must first be audited, classified and reviewed before removal. Never auto-delete files. Never auto-refactor architecture without approval.
- **No duplicate components**: Reusability is paramount. Before creating a new component, ensure an existing one in the canonical stack does not already serve the purpose.
- **No dead scripts**: Remove commented-out code, unused functions, and unused dependencies.
- **No silent architectural drift**: Stick to the approved architecture. Any deviation must be proposed and documented.
- **No arbitrary package additions**: Do not add new npm packages. Any new dependency must go through strict review.

## Refactoring Protocol
Before initiating any refactor, the following 5-step strict protocol must be executed:
1. **Detect canonical implementation**: Identify the official/approved component or module for the task.
2. **Detect duplicate systems**: Find any shadowing or overlapping systems that conflict with the canonical path.
3. **Detect active runtime path**: Map exactly how the data flows in production before changing it.
4. **Produce migration plan**: Create a structured artifact detailing the steps to move from legacy to canonical.
5. **Require user approval**: Do not execute the refactor without explicit Boardroom (User) permission.
