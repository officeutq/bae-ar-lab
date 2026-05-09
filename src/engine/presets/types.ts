import type { WarpPreset } from '@app-types/preset';
import { CURRENT_PRESET_SCHEMA_VERSION } from './presetSchema';

export { CURRENT_PRESET_SCHEMA_VERSION };

export type PresetMetadata = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type StoredPreset = PresetMetadata & {
  preset: WarpPreset;
};

export type PresetCollection = {
  presets: StoredPreset[];
  lastUsedPresetId: string | null;
};
