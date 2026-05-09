import type { WarpWeightMap } from '@app-types/preset';
import type { Vec2 } from './types';

const EPSILON = 1e-6;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function evaluateWeightMap(uv: Vec2, weightMap?: WarpWeightMap): number {
  if (!weightMap || weightMap.type === 'uniform') {
    return 1;
  }

  const radius = Math.max(EPSILON, weightMap.radius);
  const dx = uv.x - weightMap.center.x;
  const dy = uv.y - weightMap.center.y;
  const normalizedDistance = Math.hypot(dx, dy) / radius;
  return clamp01(1 - normalizedDistance);
}
