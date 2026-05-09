import type { WarpPreset } from '@app-types/preset';
import { faceSlimPreset } from './faceSlim';
import { naturalPreset } from './natural';
import { skinTonePreset } from './skinTone';
import { softBeautyPreset } from './softBeauty';
import { strongBeautyPreset } from './strongBeauty';

export type SamplePresetId = 'natural_beauty' | 'soft_beauty' | 'strong_beauty' | 'face_slim' | 'skin_tone';

export const samplePresets: Record<SamplePresetId, { id: SamplePresetId; label: string; preset: WarpPreset }> = {
  natural_beauty: { id: 'natural_beauty', label: 'ナチュラル美顔', preset: naturalPreset },
  soft_beauty: { id: 'soft_beauty', label: 'Soft Beauty', preset: softBeautyPreset },
  strong_beauty: { id: 'strong_beauty', label: 'Strong Beauty', preset: strongBeautyPreset },
  face_slim: { id: 'face_slim', label: 'Face Slim', preset: faceSlimPreset },
  skin_tone: { id: 'skin_tone', label: 'Skin Tone', preset: skinTonePreset },
};

export const samplePresetList = Object.values(samplePresets);
