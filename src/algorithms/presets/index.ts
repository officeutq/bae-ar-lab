import type { WarpPreset } from '@app-types/preset';
import { cleanBeautyPreset } from './cleanBeauty';
import { debugWarpStrongPreset } from './debugWarpStrong';
import { faceSlimPreset } from './faceSlim';
import { liteBeautyPreset } from './liteBeauty';
import { naturalPreset } from './natural';
import { skinTonePreset } from './skinTone';
import { softBeautyPreset } from './softBeauty';
import { strongBeautyPreset } from './strongBeauty';

export type SamplePresetId = 'natural_beauty' | 'clean_beauty' | 'lite_beauty' | 'debug_warp_strong' | 'soft_beauty' | 'strong_beauty' | 'face_slim' | 'skin_tone';

export const samplePresets: Record<SamplePresetId, { id: SamplePresetId; label: string; preset: WarpPreset }> = {
  natural_beauty: { id: 'natural_beauty', label: 'ナチュラル美顔', preset: naturalPreset },
  clean_beauty: { id: 'clean_beauty', label: 'きれいめ美顔', preset: cleanBeautyPreset },
  lite_beauty: { id: 'lite_beauty', label: '軽量美顔', preset: liteBeautyPreset },
  debug_warp_strong: { id: 'debug_warp_strong', label: 'デバッグ強変形', preset: debugWarpStrongPreset },
  soft_beauty: { id: 'soft_beauty', label: 'Soft Beauty', preset: softBeautyPreset },
  strong_beauty: { id: 'strong_beauty', label: 'Strong Beauty', preset: strongBeautyPreset },
  face_slim: { id: 'face_slim', label: 'Face Slim', preset: faceSlimPreset },
  skin_tone: { id: 'skin_tone', label: 'Skin Tone', preset: skinTonePreset },
};

export const samplePresetList = Object.values(samplePresets);
