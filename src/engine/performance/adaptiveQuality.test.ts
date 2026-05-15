import { describe, expect, it } from 'vitest';
import { QUALITY_MIN_FPS_SAMPLES, QUALITY_PRESETS, QUALITY_LOCK_MS, QUALITY_RECOVERY_MS, QUALITY_WARMUP_MS, createAdaptiveQualityController } from './adaptiveQuality';

describe('adaptive quality controller', () => {
  it('ignores adjustments during warmup and then downshifts in stages', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();

    expect(controller.evaluate(0, baseNow + QUALITY_WARMUP_MS - 1, 1).nextQuality).toBe('high');
    expect(controller.evaluate(34, baseNow + QUALITY_WARMUP_MS + 100, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('medium');
    expect(controller.evaluate(29, baseNow + QUALITY_WARMUP_MS + 200, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('medium');
    expect(controller.evaluate(29, baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.evaluate(23, baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS * 2 + 300, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('critical');
  });

  it('requires sustained recovery before upshift', () => {
    const controller = createAdaptiveQualityController('low');
    const baseNow = performance.now();
    const unlockedAt = baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 200;

    expect(controller.evaluate(36, unlockedAt, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt)).toBe(0);

    expect(controller.evaluate(38, unlockedAt + 100, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + 100)).toBe(0);

    expect(controller.evaluate(42, unlockedAt + 200, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + 200)).toBe(0);

    expect(controller.evaluate(43, unlockedAt + 300, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + 300)).toBe(0);

    expect(controller.evaluate(43, unlockedAt + QUALITY_RECOVERY_MS + 200, QUALITY_MIN_FPS_SAMPLES).nextQuality).toBe('low');
    expect(controller.getRecoveryElapsedMs(unlockedAt + QUALITY_RECOVERY_MS + 200)).toBe(QUALITY_RECOVERY_MS - 100);

    const decision = controller.evaluate(43, unlockedAt + QUALITY_RECOVERY_MS + 400, QUALITY_MIN_FPS_SAMPLES);
    expect(decision.nextQuality).toBe('medium');
    expect(decision.reason).toBe('fps_recovered');
    expect(controller.getRecoveryElapsedMs(unlockedAt + QUALITY_RECOVERY_MS + 100)).toBe(0);
  });

  it('reports remaining lock duration after quality change', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();
    controller.evaluate(34, baseNow + QUALITY_WARMUP_MS + 100, QUALITY_MIN_FPS_SAMPLES);

    expect(controller.getLockRemainingMs(baseNow + QUALITY_WARMUP_MS + 100)).toBe(QUALITY_LOCK_MS);
    expect(controller.getLockRemainingMs(baseNow + QUALITY_WARMUP_MS + QUALITY_LOCK_MS + 100)).toBe(0);
  });

  it('critical preset applies aggressive limits', () => {
    expect(QUALITY_PRESETS.critical.renderScale).toBe(0.65);
    expect(QUALITY_PRESETS.critical.mediapipeIntervalFrames).toBe(3);
    expect(QUALITY_PRESETS.critical.disabledTargets).toContain('nose');
  });

  it('keeps high and avoids timers when samples/fps are invalid', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();
    const unlockedAt = baseNow + QUALITY_WARMUP_MS + 100;

    const invalidNaN = controller.evaluate(Number.NaN, unlockedAt, QUALITY_MIN_FPS_SAMPLES);
    expect(invalidNaN.nextQuality).toBe('high');
    expect(invalidNaN.reason).toBe('insufficient_samples');
    expect(controller.getRecoveryElapsedMs(unlockedAt)).toBe(0);
    expect(controller.getLockRemainingMs(unlockedAt)).toBe(0);

    const invalidZero = controller.evaluate(0, unlockedAt + 100, QUALITY_MIN_FPS_SAMPLES);
    expect(invalidZero.nextQuality).toBe('high');
    expect(invalidZero.reason).toBe('insufficient_samples');

    const insufficientSamples = controller.evaluate(10, unlockedAt + 200, QUALITY_MIN_FPS_SAMPLES - 1);
    expect(insufficientSamples.nextQuality).toBe('high');
    expect(insufficientSamples.reason).toBe('insufficient_samples');
  });

  it('drops quickly after warmup based on current fps', () => {
    const controller = createAdaptiveQualityController('high');
    const baseNow = performance.now();

    const decision = controller.evaluate(20, baseNow + QUALITY_WARMUP_MS + 1, QUALITY_MIN_FPS_SAMPLES);
    expect(decision.nextQuality).toBe('critical');
    expect(decision.reason).toBe('fps_drop');
  });
});
