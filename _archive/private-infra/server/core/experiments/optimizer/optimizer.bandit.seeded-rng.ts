export function hashStringToSeed(input: string): number {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return function next(): number {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
