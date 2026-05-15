import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS, QUALITY_LOCK_MS, QUALITY_WARMUP_MS, createAdaptiveQualityController } from './adaptiveQuality';

describe('adaptive quality controller', () => {
  it('ignores adjustments during warmup and then downshifts in stages', () => {
    const controller = createAdaptiveQualityController('high');

    expect(controller.evaluate(20, QUALITY_WARMUP_MS - 1).nextQuality).toBe('high');
    expect(controller.evaluate(34, QUALITY_WARMUP_MS + 100).nextQuality).toBe('medium');
    expect(controller.evaluate(29, QUALITY_WARMUP_MS + 200).nextQuality).toBe('medium');
    expect(controller.evaluate(29, QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200).nextQuality).toBe('low');
    expect(controller.evaluate(23, QUALITY_WARMUP_MS + QUALITY_LOCK_MS * 2 + 300).nextQuality).toBe('critical');
  });

  it('uses stronger hysteresis for upshift', () => {
    const controller = createAdaptiveQualityController('low');

    expect(controller.evaluate(36, QUALITY_WARMUP_MS + 100).nextQuality).toBe('low');
    const decision = controller.evaluate(38, QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200);
    expect(decision.nextQuality).toBe('medium');
    expect(decision.reason).toBe('fps_recovered');
  });

  it('reports remaining lock duration after quality change', () => {
    const controller = createAdaptiveQualityController('high');
    controller.evaluate(34, QUALITY_WARMUP_MS + 100);

    expect(controller.getLockRemainingMs(QUALITY_WARMUP_MS + 100)).toBe(QUALITY_LOCK_MS);
    expect(controller.getLockRemainingMs(QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 100)).toBe(0);
  });

  it('critical preset applies aggressive limits', () => {
    expect(QUALITY_PRESETS.critical.renderScale).toBe(0.65);
    expect(QUALITY_PRESETS.critical.mediapipeIntervalFrames).toBe(3);
    expect(QUALITY_PRESETS.critical.disabledTargets).toContain('nose');
  });
});
