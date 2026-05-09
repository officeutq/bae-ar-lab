import type { WarpPreset } from '@app-types/preset';

export const PRESET_SCHEMA_VERSION = 1;

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
