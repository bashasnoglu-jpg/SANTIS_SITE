import type { SantisEvent } from "@santis-core/event-contracts";

export interface TransactionContext {
  readonly events: SantisEvent[];
  addEvent(event: SantisEvent): void;
}

export interface UnitOfWork {
  runInTransaction<T>(
    work: (ctx: TransactionContext) => Promise<T>
  ): Promise<T>;
}

export class DefaultTransactionContext implements TransactionContext {
  public readonly events: SantisEvent[] = [];

  addEvent(event: SantisEvent): void {
    this.events.push(event);
  }
}
