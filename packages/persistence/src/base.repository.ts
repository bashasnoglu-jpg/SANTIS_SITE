import type { SovereignContext } from "@santis/domain-schema/src/core-state.interface";

export abstract class SovereignRepository<T extends { tenantId?: string }> {
  protected abstract db: any;

  protected async secureInsert(ctx: SovereignContext, data: Partial<T>) {
    const safeData = {
      ...data,
      tenantId: ctx.tenant.tenantId,
    };

    return this.db.insert(safeData);
  }

  protected async secureQuery(ctx: SovereignContext, query: any) {
    return this.db.query({
      ...query,
      where: {
        ...(query.where || {}),
        tenantId: ctx.tenant.tenantId,
      },
    });
  }
}
