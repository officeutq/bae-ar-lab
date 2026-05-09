import type { WarpPreset } from '@app-types/preset';

export const defaultWarpPreset: WarpPreset = {
  id: 'default-warp-v1',
  name: 'Default Warp',
  version: '1.0.0',
  params: {
    intensity: 0.3,
    smoothness: 0.5,
    falloff: 'smoothstep',
  },
};
