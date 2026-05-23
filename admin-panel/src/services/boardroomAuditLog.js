import { getMockAuditLog } from '../mocks/sovereignMemoryAuditLog';

export async function fetchBoardroomAuditLog() {
  try {
    const res = await fetch('/api/v1/boardroom/audit-log');

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    return {
      data: Array.isArray(json.data) ? json.data : [],
      source: 'live',
      error: null,
    };
  } catch (error) {
    return {
      data: getMockAuditLog(),
      source: 'mock',
      error,
    };
  }
}
