import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS, QUALITY_LOCK_MS, QUALITY_RECOVERY_MS, QUALITY_WARMUP_MS, createAdaptiveQualityController } from './adaptiveQuality';

describe('adaptive quality controller', () => {
  it('ignores adjustments during warmup and then downshifts in stages', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();

    expect(controller.evaluate(20, baseNow + QUALITY_WARMUP_MS - 1).nextQuality).toBe('high');
    expect(controller.evaluate(34, baseNow + QUALITY_WARMUP_MS + 100).nextQuality).toBe('medium');
    expect(controller.evaluate(29, baseNow + QUALITY_WARMUP_MS + 200).nextQuality).toBe('medium');
    expect(controller.evaluate(29, baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200).nextQuality).toBe('low');
    expect(controller.evaluate(23, baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS * 2 + 300).nextQuality).toBe('critical');
  });

  it('requires sustained recovery before upshift', () => {
    const controller = createAdaptiveQualityController('low');
    const baseNow = performance.now();
    const unlockedAt = baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200;

    expect(controller.evaluate(36, unlockedAt).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt)).toBe(0);

    expect(controller.evaluate(38, unlockedAt + 100).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + 100)).toBe(0);

    expect(controller.evaluate(38, unlockedAt + QUALITY_RECOVERY_MS - 100).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + QUALITY_RECOVERY_MS - 100)).toBe(QUALITY_RECOVERY_MS - 200);

    const decision = controller.evaluate(38, unlockedAt + QUALITY_RECOVERY_MS + 100);
    expect(decision.nextQuality).toBe('medium');
    expect(decision.reason).toBe('fps_recovered');
    expect(controller.getRecoveryElapsedMs(unlockedAt + QUALITY_RECOVERY_MS + 100)).toBe(0);
  });

  it('reports remaining lock duration after quality change', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();
    controller.evaluate(34, baseNow + QUALITY_WARMUP_MS + 100);

    expect(controller.getLockRemainingMs(baseNow + QUALITY_WARMUP_MS + 100)).toBe(QUALITY_LOCK_MS);
    expect(controller.getLockRemainingMs(baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 100)).toBe(0);
  });

  it('critical preset applies aggressive limits', () => {
    expect(QUALITY_PRESETS.critical.renderScale).toBe(0.65);
    expect(QUALITY_PRESETS.critical.mediapipeIntervalFrames).toBe(3);
    expect(QUALITY_PRESETS.critical.disabledTargets).toContain('nose');
  });
});
