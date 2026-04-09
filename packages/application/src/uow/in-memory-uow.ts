import {
  DefaultTransactionContext,
  type UnitOfWork,
} from "./index.js";

export class InMemoryUnitOfWork implements UnitOfWork {
  async runInTransaction<T>(
    work: (ctx: DefaultTransactionContext) => Promise<T>
  ): Promise<T> {
    const tx = new DefaultTransactionContext();

    try {
      const result = await work(tx);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
