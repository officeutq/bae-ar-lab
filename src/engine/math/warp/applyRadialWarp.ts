import type { RadialWarpInput, RadialWarpResult } from './types';
import { computeWarpInfluence } from './computeWarpInfluence';

const EPSILON = 1e-6;

export function applyRadialWarp(input: RadialWarpInput): RadialWarpResult {
  const axisX = Math.max(EPSILON, Math.abs(input.axis.x));
  const axisY = Math.max(EPSILON, Math.abs(input.axis.y));
  const radius = Math.max(EPSILON, input.radius);

  const dx = input.uv.x - input.center.x;
  const dy = input.uv.y - input.center.y;

  const scaledDx = dx / axisX;
  const scaledDy = dy / axisY;

  const distance = Math.hypot(scaledDx, scaledDy);
  const normalizedDistance = distance / radius;
  const influence = computeWarpInfluence(normalizedDistance, input.falloff);

  if (influence <= 0 || distance <= EPSILON) {
    return {
      warpedUv: { ...input.uv },
      influence,
    };
  }

  const movementScale = 1 + input.strength * influence;

  const warpedScaledDx = scaledDx * movementScale;
  const warpedScaledDy = scaledDy * movementScale;

  return {
    warpedUv: {
      x: input.center.x + warpedScaledDx * axisX,
      y: input.center.y + warpedScaledDy * axisY,
    },
    influence,
  };
}
