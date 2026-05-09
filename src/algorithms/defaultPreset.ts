import type { WarpPreset } from '@app-types/preset';

export const defaultWarpPreset: WarpPreset = {
  version: 1,
  operations: [
    {
      id: 'left_eye_enlarge',
      enabled: true,
      type: 'radial_warp',
      target: 'left_eye',
      strength: 0.08,
      radius: 1.8,
      falloff: {
        type: 'smoothstep',
      },
      axis: {
        x: 1,
        y: 0.7,
      },
    },
  ],
};
