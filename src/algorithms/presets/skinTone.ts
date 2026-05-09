import type { WarpPreset } from '@app-types/preset';

export const skinTonePreset: WarpPreset = {
  schemaVersion: 1,
  id: 'skin_tone',
  name: 'Skin Tone',
  appearance: {
    skinSmoothing: {
      type: 'skin_smoothing',
      enabled: true,
      strength: 0.42,
      radius: 1.25,
      maskOpacity: 0.95,
      showMaskPreview: false,
    },
    skinTone: {
      type: 'skin_tone',
      enabled: true,
      brightness: 0.04,
      saturation: 1.08,
      warmth: 0.1,
      blend: 0.72,
    },
  },
  operations: [],
};
