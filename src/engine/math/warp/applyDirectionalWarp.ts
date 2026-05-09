import { computeWarpInfluence } from './computeWarpInfluence';
import type { Vec2 } from './types';
import type { WarpFalloffType } from '@app-types/preset';

const EPSILON = 1e-6;

export type DirectionalWarpInput = {
  uv: Vec2;
  center: Vec2;
  radius: number;
  strength: number;
  axis: Vec2;
  direction: Vec2;
  falloff: WarpFalloffType;
};

export function applyDirectionalWarp(input: DirectionalWarpInput) {
  const axisX = Math.max(EPSILON, Math.abs(input.axis.x));
  const axisY = Math.max(EPSILON, Math.abs(input.axis.y));
  const radius = Math.max(EPSILON, input.radius);
  const dx = input.uv.x - input.center.x;
  const dy = input.uv.y - input.center.y;
  const distance = Math.hypot(dx / axisX, dy / axisY);
  const influence = computeWarpInfluence(distance / radius, input.falloff);

  return {
    warpedUv: {
      x: input.uv.x + input.direction.x * input.strength * influence,
      y: input.uv.y + input.direction.y * input.strength * influence,
    },
    influence,
  };
}
