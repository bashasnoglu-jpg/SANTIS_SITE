import type { NormalizedService } from '../../schemas/normalized.schemas.ts';
import { MockServiceCatalogProvider } from './providers/mock-service-catalog.provider.ts';

export interface ServiceCatalogAdapter {
  getServices(input: {
    tenantId: string;
    locale: string;
  }): Promise<NormalizedService[]>;
}

export const serviceCatalogAdapter: ServiceCatalogAdapter =
  new MockServiceCatalogProvider();
