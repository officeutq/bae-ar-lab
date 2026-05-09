export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';

export type QualityPreset = {
  renderScale: number;
  smoothingSampleCount: number;
  frameSkip: number;
  mediapipeIntervalFrames: number;
};

export const QUALITY_ORDER: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  ultra: { renderScale: 1, smoothingSampleCount: 13, frameSkip: 0, mediapipeIntervalFrames: 1 },
  high: { renderScale: 0.85, smoothingSampleCount: 9, frameSkip: 0, mediapipeIntervalFrames: 1 },
  medium: { renderScale: 0.7, smoothingSampleCount: 5, frameSkip: 1, mediapipeIntervalFrames: 2 },
  low: { renderScale: 0.5, smoothingSampleCount: 3, frameSkip: 2, mediapipeIntervalFrames: 3 },
};

export type AdaptiveQualityState = {
  enabled: boolean;
  selectedQuality: QualityLevel;
  currentQuality: QualityLevel;
};

export type AutoAdjustDecision = { nextQuality: QualityLevel; changed: boolean };

const DOWNSHIFT_FPS = 24;
const UPSHIFT_FPS = 50;
const MIN_ADJUST_GAP_MS = 1200;

export function resolveRuntimeQuality(state: AdaptiveQualityState): QualityLevel {
  return state.enabled ? state.currentQuality : state.selectedQuality;
}

export function createAdaptiveQualityController(initialQuality: QualityLevel = 'high') {
  let currentQuality: QualityLevel = initialQuality;
  let lastAdjustAt = 0;

  return {
    getQuality: () => currentQuality,
    setQuality: (quality: QualityLevel) => {
      currentQuality = quality;
    },
    evaluate(avgFps: number, now = performance.now()): AutoAdjustDecision {
      if (now - lastAdjustAt < MIN_ADJUST_GAP_MS) {
        return { nextQuality: currentQuality, changed: false };
      }
      const index = QUALITY_ORDER.indexOf(currentQuality);
      if (avgFps < DOWNSHIFT_FPS && index < QUALITY_ORDER.length - 1) {
        currentQuality = QUALITY_ORDER[index + 1];
        lastAdjustAt = now;
        return { nextQuality: currentQuality, changed: true };
      }
      if (avgFps > UPSHIFT_FPS && index > 0) {
        currentQuality = QUALITY_ORDER[index - 1];
        lastAdjustAt = now;
        return { nextQuality: currentQuality, changed: true };
      }
      return { nextQuality: currentQuality, changed: false };
    },
  };
}
