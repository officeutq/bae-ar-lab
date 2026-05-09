import { computeWarpInfluence } from './computeWarpInfluence';
import type { Vec2 } from './types';
import type { WarpFalloffType, WarpWeightMap } from '@app-types/preset';

const EPSILON = 1e-6;
import { evaluateWeightMap } from './evaluateWeightMap';

export type RegionWarpInput = {
  uv: Vec2;
  polygon: Vec2[];
  strength: number;
  direction: Vec2;
  width: number;
  falloff: WarpFalloffType;
  weightMap?: WarpWeightMap;
};

function pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2): number {
  const sx = point.x - start.x;
  const sy = point.y - start.y;
  const lx = end.x - start.x;
  const ly = end.y - start.y;
  const denom = lx * lx + ly * ly;
  const t = denom <= EPSILON ? 0 : Math.min(1, Math.max(0, (sx * lx + sy * ly) / denom));
  const px = start.x + lx * t;
  const py = start.y + ly * t;
  return Math.hypot(point.x - px, point.y - py);
}

function isPointInConvexPolygon(point: Vec2, polygon: Vec2[]): boolean {
  if (polygon.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (Math.abs(cross) <= EPSILON) continue;
    const currentSign = cross > 0 ? 1 : -1;
    if (sign === 0) sign = currentSign;
    if (sign !== currentSign) return false;
  }
  return true;
}

export function applyRegionWarp(input: RegionWarpInput) {
  if (input.polygon.length < 3) {
    return { warpedUv: input.uv, influence: 0 };
  }
  const width = Math.max(EPSILON, input.width);
  const inside = isPointInConvexPolygon(input.uv, input.polygon);
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < input.polygon.length; i += 1) {
    const a = input.polygon[i];
    const b = input.polygon[(i + 1) % input.polygon.length];
    minDistance = Math.min(minDistance, pointToSegmentDistance(input.uv, a, b));
  }
  const normalizedDistance = inside ? 0 : minDistance / width;
  const regionInfluence = computeWarpInfluence(normalizedDistance, input.falloff);
  const weightInfluence = evaluateWeightMap(input.uv, input.weightMap);
  const influence = regionInfluence * weightInfluence;
  return {
    warpedUv: {
      x: input.uv.x + input.direction.x * input.strength * influence,
      y: input.uv.y + input.direction.y * input.strength * influence,
    },
    influence,
  };
}
