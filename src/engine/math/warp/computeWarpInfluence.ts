import { gaussianFalloff } from '@engine/math/falloff/gaussian';
import { linearFalloff } from '@engine/math/falloff/linear';
import { smoothstepFalloff } from '@engine/math/falloff/smoothstep';
import type { WarpFalloffType } from '@app-types/preset';

const EPSILON = 1e-6;

export function computeWarpInfluence(normalizedDistance: number, falloff: WarpFalloffType): number {
  const t = Math.min(1, Math.max(0, normalizedDistance));

  if (t >= 1) {
    return 0;
  }

  if (falloff === 'linear') {
    return linearFalloff(t);
  }

  if (falloff === 'gaussian') {
    const base = gaussianFalloff(t);
    const edge = gaussianFalloff(1);
    return Math.max(0, (base - edge) / Math.max(EPSILON, 1 - edge));
  }

  return smoothstepFalloff(t);
}
