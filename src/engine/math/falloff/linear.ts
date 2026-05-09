export function linearFalloff(normalizedDistance: number): number {
  const clampedDistance = Math.min(Math.max(normalizedDistance, 0), 1);
  return 1 - clampedDistance;
}
