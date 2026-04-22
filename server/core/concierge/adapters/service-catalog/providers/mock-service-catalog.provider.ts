import type { ServiceCatalogAdapter } from '../service-catalog.adapter';
import type { NormalizedService } from '../../../schemas/normalized.schemas';
import { mapRawServiceToNormalized } from '../../../mappers/service.mapper';

export class MockServiceCatalogProvider implements ServiceCatalogAdapter {
  async getServices(_: {
    tenantId: string;
    locale: string;
  }): Promise<NormalizedService[]> {
    const raw = [
      {
        id: 'svc_signature_ritual',
        name: 'Signature Ritual',
        duration: '80 min',
        category: 'ritual',
        active: true,
        commercialPriority: 90,
      },
      {
        id: 'svc_deep_tissue',
        name: 'Deep Tissue Massage',
        duration: '50 min',
        category: 'massage',
        active: true,
        commercialPriority: 75,
      },
      {
        id: 'svc_hamam_royal',
        name: 'Royal Hamam',
        duration: 60,
        category: 'hamam',
        active: true,
        commercialPriority: 85,
      },
      {
        id: 'svc_skin_glow',
        name: 'Skin Glow Facial',
        duration: '50 min',
        category: 'facial',
        active: true,
        commercialPriority: 70,
      },
    ];

    return raw.map(mapRawServiceToNormalized).filter((s) => s.isActive);
  }
}
