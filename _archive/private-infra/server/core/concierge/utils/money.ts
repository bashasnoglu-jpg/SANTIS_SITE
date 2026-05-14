export function maxNumberOrUndefined(values: Array<number | null | undefined>): number | undefined {
  const filtered = values.filter((v): v is number => typeof v === 'number');
  if (!filtered.length) return undefined;
  return Math.max(...filtered);
}
