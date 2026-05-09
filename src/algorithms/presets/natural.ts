import type { WarpPreset } from '@app-types/preset';

export const naturalPreset: WarpPreset = {
  version: 1,
  appearance: {
    skinSmoothing: {
      type: 'skin_smoothing',
      enabled: true,
      strength: 0.24,
      radius: 0.95,
      maskOpacity: 0.85,
      showMaskPreview: false,
    },
    skinTone: {
      type: 'skin_tone',
      enabled: true,
      brightness: 0.02,
      saturation: 1.03,
      warmth: 0.03,
      blend: 0.5,
    },
  },
  operations: [],
};
