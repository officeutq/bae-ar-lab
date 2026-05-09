import type { WarpFalloffType } from '@app-types/preset';
import { gaussianFalloff } from '@engine/math/falloff/gaussian';
import { linearFalloff } from '@engine/math/falloff/linear';
import { smoothstepFalloff } from '@engine/math/falloff/smoothstep';

export type FalloffSamplePoint = {
  distance: number;
  value: number;
};

const DEFAULT_SAMPLE_COUNT = 64;

function evaluateFalloff(type: WarpFalloffType, normalizedDistance: number): number {
  if (type === 'linear') {
    return linearFalloff(normalizedDistance);
  }

  if (type === 'smoothstep') {
    return smoothstepFalloff(normalizedDistance);
  }

  return gaussianFalloff(normalizedDistance);
}

export function sampleFalloffCurve(type: WarpFalloffType, sampleCount = DEFAULT_SAMPLE_COUNT): FalloffSamplePoint[] {
  const safeSampleCount = Math.max(2, Math.floor(sampleCount));

  return Array.from({ length: safeSampleCount }, (_, index) => {
    const distance = index / (safeSampleCount - 1);

    return {
      distance,
      value: evaluateFalloff(type, distance),
    };
  });
}
