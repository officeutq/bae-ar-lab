import type { WarpOperation, WarpPreset } from '@app-types/preset';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const blendOperation = (operation: WarpOperation, intensity: number): WarpOperation => ({
  ...operation,
  strength: lerp(0, operation.strength, intensity),
  radius: lerp(0, operation.radius, intensity),
});

export const blendPresetByIntensity = (preset: WarpPreset, intensityInput: number): WarpPreset => {
  const intensity = clamp01(intensityInput);

  return {
    ...preset,
    operations: preset.operations.map((operation) => blendOperation(operation, intensity)),
    appearance: preset.appearance
      ? {
        skinSmoothing: {
          ...preset.appearance.skinSmoothing,
          strength: lerp(0, preset.appearance.skinSmoothing.strength, intensity),
          radius: lerp(0, preset.appearance.skinSmoothing.radius, intensity),
        },
        skinTone: preset.appearance.skinTone
          ? {
            ...preset.appearance.skinTone,
            brightness: lerp(0, preset.appearance.skinTone.brightness, intensity),
            saturation: lerp(1, preset.appearance.skinTone.saturation, intensity),
            warmth: lerp(0, preset.appearance.skinTone.warmth, intensity),
            blend: lerp(0, preset.appearance.skinTone.blend, intensity),
          }
          : undefined,
      }
      : undefined,
  };
};
