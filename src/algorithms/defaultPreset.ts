import type { WarpPreset } from '@app-types/preset';
import { naturalPreset } from '@algorithms/presets/natural';

export const defaultWarpPreset: WarpPreset = {
  ...naturalPreset,
  id: 'default',
  name: 'Default',
};
