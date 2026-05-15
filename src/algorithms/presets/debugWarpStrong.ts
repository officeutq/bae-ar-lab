import type { WarpPreset } from '@app-types/preset';
import { CURRENT_PRESET_SCHEMA_VERSION } from '@engine/presets/presetSchema';

export const debugWarpStrongPreset: WarpPreset = {
  schemaVersion: CURRENT_PRESET_SCHEMA_VERSION,
  id: 'debug_warp_strong',
  name: 'デバッグ強変形',
  description: 'warp反映確認用の強変形プリセット（本番非推奨）',
  operations: [
    {
      id: 'debug_left_eye_enlarge', enabled: true, type: 'radial_warp', target: 'left_eye', strength: 0.28, radius: 2.2,
      falloff: { type: 'smoothstep' }, axis: { x: 1.1, y: 0.9 }, direction: { x: 0, y: 0 },
      lineStart: { x: 0.3, y: 0.5 }, lineEnd: { x: 0.7, y: 0.5 }, width: 0.12, polygon: [],
      weightMap: { type: 'radial_gradient', center: { x: 0.5, y: 0.5 }, radius: 0.95 },
    },
    {
      id: 'debug_right_eye_enlarge', enabled: true, type: 'radial_warp', target: 'right_eye', strength: 0.28, radius: 2.2,
      falloff: { type: 'smoothstep' }, axis: { x: 1.1, y: 0.9 }, direction: { x: 0, y: 0 },
      lineStart: { x: 0.3, y: 0.5 }, lineEnd: { x: 0.7, y: 0.5 }, width: 0.12, polygon: [],
      weightMap: { type: 'radial_gradient', center: { x: 0.5, y: 0.5 }, radius: 0.95 },
    },
    {
      id: 'debug_mouth', enabled: true, type: 'radial_warp', target: 'mouth', strength: 0.18, radius: 1.4,
      falloff: { type: 'smoothstep' }, axis: { x: 1.2, y: 0.9 }, direction: { x: 0, y: 0 },
      lineStart: { x: 0.4, y: 0.65 }, lineEnd: { x: 0.6, y: 0.65 }, width: 0.12, polygon: [],
      weightMap: { type: 'radial_gradient', center: { x: 0.5, y: 0.58 }, radius: 0.9 },
    },
    {
      id: 'debug_left_jaw', enabled: true, type: 'line_warp', target: 'left_jaw', strength: 0.45, radius: 1,
      falloff: { type: 'smoothstep' }, axis: { x: 1, y: 1 }, direction: { x: 0.06, y: 0 },
      lineStart: { x: 0.25, y: 0.47 }, lineEnd: { x: 0.46, y: 0.73 }, width: 0.18, polygon: [],
      binding: { type: 'landmark_line', start: 'left_cheek', end: 'chin' },
    },
    {
      id: 'debug_right_jaw', enabled: true, type: 'line_warp', target: 'right_jaw', strength: 0.45, radius: 1,
      falloff: { type: 'smoothstep' }, axis: { x: 1, y: 1 }, direction: { x: -0.06, y: 0 },
      lineStart: { x: 0.75, y: 0.47 }, lineEnd: { x: 0.54, y: 0.73 }, width: 0.18, polygon: [],
      binding: { type: 'landmark_line', start: 'right_cheek', end: 'chin' },
    },
  ],
};
