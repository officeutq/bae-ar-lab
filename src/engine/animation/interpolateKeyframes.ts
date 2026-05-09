import type { AnimationKeyframe } from './types';

export function interpolateKeyframes(keyframes: AnimationKeyframe[], time: number): number {
  if (keyframes.length === 0) {
    return 0;
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) {
    return sorted[0].value;
  }

  const last = sorted[sorted.length - 1];
  if (time >= last.time) {
    return last.value;
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index];
    const end = sorted[index + 1];
    if (time >= start.time && time <= end.time) {
      const span = Math.max(1e-6, end.time - start.time);
      const alpha = (time - start.time) / span;
      return start.value + (end.value - start.value) * alpha;
    }
  }

  return last.value;
}
