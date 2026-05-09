import type { WarpPreset } from '@app-types/preset';
import { defaultWarpPreset } from '@algorithms/defaultPreset';

export const strongBeautyPreset: WarpPreset = {
  ...defaultWarpPreset,
  id: 'strong_beauty',
  name: 'Strong Beauty',
  appearance: {
    skinSmoothing: {
      type: 'skin_smoothing',
      enabled: true,
      strength: 0.48,
      radius: 1.25,
      maskOpacity: 1,
      showMaskPreview: false,
    },
    skinTone: {
      type: 'skin_tone',
      enabled: true,
      brightness: 0.05,
      saturation: 1.12,
      warmth: 0.12,
      blend: 0.75,
    },
  },
  operations: defaultWarpPreset.operations.map((operation) => {
    if (operation.type === 'radial_warp') {
      return { ...operation, strength: 0.12, radius: 2 };
    }
    if (operation.type === 'line_warp') {
      return { ...operation, strength: 0.08 };
    }
    if (operation.type === 'region_warp') {
      return { ...operation, strength: -0.055 };
    }
    return operation;
  }),
};
