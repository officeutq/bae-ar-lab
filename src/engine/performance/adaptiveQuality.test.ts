import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS, createAdaptiveQualityController } from './adaptiveQuality';

describe('adaptive quality controller', () => {
  it('downshifts in stages with fps thresholds', () => {
    const controller = createAdaptiveQualityController('high');

    expect(controller.evaluate(34, 3000).nextQuality).toBe('medium');
    expect(controller.evaluate(29, 6000).nextQuality).toBe('low');
    expect(controller.evaluate(23, 9000).nextQuality).toBe('critical');
  });

  it('uses hysteresis for upshift', () => {
    const controller = createAdaptiveQualityController('low');

    expect(controller.evaluate(33, 3000).nextQuality).toBe('low');
    const decision = controller.evaluate(35, 6000);
    expect(decision.nextQuality).toBe('medium');
    expect(decision.reason).toBe('fps_recovered');
  });

  it('critical preset applies aggressive limits', () => {
    expect(QUALITY_PRESETS.critical.renderScale).toBe(0.65);
    expect(QUALITY_PRESETS.critical.mediapipeIntervalFrames).toBe(3);
    expect(QUALITY_PRESETS.critical.disabledTargets).toContain('nose');
  });
});
