/**
 * SovereignDiffEngine
 * İki state arasındaki farkları yakalar ve denetlenebilir bir formatta sunar.
 */
export function computeStateDiff(before: any, after: any): Record<string, { from: any, to: any }> {
  const diff: Record<string, { from: any, to: any }> = {};

  // Basit recursive diff logic (Santis OS Quiet Luxury Standard)
  const findDifferences = (obj1: any, obj2: any, path = "") => {
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of keys) {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        findDifferences(val1, val2, fullPath);
      } else if (val1 !== val2) {
        diff[fullPath] = { from: val1, to: val2 };
      }
    }
  };

  findDifferences(before, after);
  return diff;
}
