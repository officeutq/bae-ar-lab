import { computeWarpInfluence } from './computeWarpInfluence';
import type { Vec2 } from './types';
import type { WarpFalloffType } from '@app-types/preset';

const EPSILON = 1e-6;

export type LineWarpInput = {
  uv: Vec2;
  lineStart: Vec2;
  lineEnd: Vec2;
  width: number;
  strength: number;
  direction: Vec2;
  falloff: WarpFalloffType;
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

export function applyLineWarp(input: LineWarpInput) {
  const width = Math.max(EPSILON, input.width);
  const distance = pointToSegmentDistance(input.uv, input.lineStart, input.lineEnd);
  const influence = computeWarpInfluence(distance / width, input.falloff);

  return {
    warpedUv: {
      x: input.uv.x + input.direction.x * input.strength * influence,
      y: input.uv.y + input.direction.y * input.strength * influence,
    },
    influence,
  };
}
