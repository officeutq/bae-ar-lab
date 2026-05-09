const GAUSSIAN_SIGMA = 0.4;

export function gaussianFalloff(normalizedDistance: number): number {
  const clampedDistance = Math.min(Math.max(normalizedDistance, 0), 1);
  const exponent = -((clampedDistance * clampedDistance) / (2 * GAUSSIAN_SIGMA * GAUSSIAN_SIGMA));
  return Math.exp(exponent);
}
