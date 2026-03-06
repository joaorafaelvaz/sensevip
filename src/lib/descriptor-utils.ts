export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Descriptor length mismatch");
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function serializeDescriptor(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

export function deserializeDescriptor(json: string): number[] {
  return JSON.parse(json);
}

export function findBestMatch(
  descriptor: number[],
  candidates: { id: string; descriptor: number[] }[],
  threshold: number
): { id: string; distance: number } | null {
  let bestMatch: { id: string; distance: number } | null = null;

  for (const candidate of candidates) {
    const distance = euclideanDistance(descriptor, candidate.descriptor);
    if (distance < threshold) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { id: candidate.id, distance };
      }
    }
  }

  return bestMatch;
}
