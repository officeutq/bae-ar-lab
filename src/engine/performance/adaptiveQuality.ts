export type QualityLevel = 'high' | 'medium' | 'low' | 'critical';

export type QualityPreset = {
  renderScale: number;
  smoothingSampleCount: number;
  frameSkip: number;
  mediapipeIntervalFrames: number;
  warpStrengthScale: number;
  maxActiveOperations: number | null;
  disabledTargets: string[];
};

export const QUALITY_ORDER: QualityLevel[] = ['high', 'medium', 'low', 'critical'];

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  high: {
    renderScale: 1,
    smoothingSampleCount: 9,
    frameSkip: 0,
    mediapipeIntervalFrames: 1,
    warpStrengthScale: 1,
    maxActiveOperations: null,
    disabledTargets: [],
  },
  medium: {
    renderScale: 0.9,
    smoothingSampleCount: 7,
    frameSkip: 0,
    mediapipeIntervalFrames: 1,
    warpStrengthScale: 0.95,
    maxActiveOperations: null,
    disabledTargets: [],
  },
  low: {
    renderScale: 0.8,
    smoothingSampleCount: 5,
    frameSkip: 1,
    mediapipeIntervalFrames: 2,
    warpStrengthScale: 0.8,
    maxActiveOperations: 8,
    disabledTargets: [],
  },
  critical: {
    renderScale: 0.65,
    smoothingSampleCount: 3,
    frameSkip: 2,
    mediapipeIntervalFrames: 3,
    warpStrengthScale: 0.7,
    maxActiveOperations: 5,
    disabledTargets: ['nose', 'mouth', 'left_jaw', 'right_jaw', 'chin_line', 'jaw_region'],
  },
};

export type AdaptiveQualityReason = 'stable' | 'fps_drop' | 'fps_recovered' | 'manual';

export type AdaptiveQualityState = {
  enabled: boolean;
  selectedQuality: QualityLevel;
  currentQuality: QualityLevel;
  reason: AdaptiveQualityReason;
};

export type AutoAdjustDecision = {
  nextQuality: QualityLevel;
  changed: boolean;
  reason: AdaptiveQualityReason;
  avgFps: number;
};

const DOWNSHIFT_THRESHOLDS: Record<QualityLevel, number> = {
  high: 35,
  medium: 30,
  low: 24,
  critical: 0,
};

const UPSHIFT_THRESHOLDS: Record<QualityLevel, number> = {
  high: Number.POSITIVE_INFINITY,
  medium: 40,
  low: 34,
  critical: 28,
};

const MIN_ADJUST_GAP_MS = 2500;

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
      lastAdjustAt = 0;
    },
    evaluate(avgFps: number, now = performance.now()): AutoAdjustDecision {
      if (now - lastAdjustAt < MIN_ADJUST_GAP_MS) {
        return { nextQuality: currentQuality, changed: false, reason: 'stable', avgFps };
      }
      const index = QUALITY_ORDER.indexOf(currentQuality);
      const shouldDownshift = avgFps < DOWNSHIFT_THRESHOLDS[currentQuality] && index < QUALITY_ORDER.length - 1;
      if (shouldDownshift) {
        currentQuality = QUALITY_ORDER[index + 1];
        lastAdjustAt = now;
        return { nextQuality: currentQuality, changed: true, reason: 'fps_drop', avgFps };
      }
      const shouldUpshift = avgFps > UPSHIFT_THRESHOLDS[currentQuality] && index > 0;
      if (shouldUpshift) {
        currentQuality = QUALITY_ORDER[index - 1];
        lastAdjustAt = now;
        return { nextQuality: currentQuality, changed: true, reason: 'fps_recovered', avgFps };
      }
      return { nextQuality: currentQuality, changed: false, reason: 'stable', avgFps };
    },
  };
}
