export const MOCK_AUDIT_LOG = Object.freeze([
  {
    id: 'mock-audit-001',
    type: 'action.approved',
    actionId: 'yield-override-001',
    operatorId: 'boardroom.demo',
    reason: 'VIP talep yoğunluğu nedeniyle premium slot önceliği onaylandı.',
    occurredAt: '2026-05-23T07:30:00.000Z',
  },
  {
    id: 'mock-audit-002',
    type: 'action.rejected',
    actionId: 'discount-rule-017',
    operatorId: 'boardroom.demo',
    reason: 'Quiet Luxury fiyat bütünlüğünü bozacağı için otomatik indirim reddedildi.',
    occurredAt: '2026-05-23T07:18:00.000Z',
  },
  {
    id: 'mock-audit-003',
    type: 'action.approved',
    actionId: 'staff-allocation-009',
    operatorId: 'concierge.lead',
    reason: 'Akşam ritüel talebi için terapist kapasitesi yeniden dengelendi.',
    occurredAt: '2026-05-23T06:55:00.000Z',
  },
  {
    id: 'mock-audit-004',
    type: 'action.approved',
    actionId: 'atmosphere-profile-004',
    operatorId: 'aurelia.system',
    reason: 'Düşük yoğunluk saatinde sakin atmosfer profili etkinleştirildi.',
    occurredAt: '2026-05-23T06:30:00.000Z',
  },
]);

export function getMockAuditLog() {
  return MOCK_AUDIT_LOG.map((entry) => ({ ...entry }));
}
