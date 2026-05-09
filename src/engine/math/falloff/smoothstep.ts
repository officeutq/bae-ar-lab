export function smoothstepFalloff(normalizedDistance: number): number {
  const clampedDistance = Math.min(Math.max(normalizedDistance, 0), 1);
  const t = clampedDistance * clampedDistance * (3 - 2 * clampedDistance);
  return 1 - t;
}
