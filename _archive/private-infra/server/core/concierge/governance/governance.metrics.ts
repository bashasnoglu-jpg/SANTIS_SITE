export function sumRevenue(records: Array<{ attributedRevenue?: number }>) {
  return records.reduce((sum, r) => sum + (r.attributedRevenue ?? 0), 0);
}

export function groupImpactByActionType(
  records: Array<{
    actionType: string;
    outcomeEvent: string;
    attributedRevenue?: number;
  }>
) {
  const map = new Map<string, { actionType: string; outcomes: number; revenue: number }>();

  for (const record of records) {
    const current = map.get(record.actionType) ?? {
      actionType: record.actionType,
      outcomes: 0,
      revenue: 0,
    };

    current.outcomes += 1;
    current.revenue += record.attributedRevenue ?? 0;

    map.set(record.actionType, current);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
