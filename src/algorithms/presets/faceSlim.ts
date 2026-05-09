import type { WarpPreset } from '@app-types/preset';

export const faceSlimPreset: WarpPreset = {
  version: 1,
  appearance: {
    skinSmoothing: {
      type: 'skin_smoothing',
      enabled: false,
      strength: 0.2,
      radius: 1,
      maskOpacity: 1,
      showMaskPreview: false,
    },
    skinTone: {
      type: 'skin_tone',
      enabled: false,
      brightness: 0,
      saturation: 1,
      warmth: 0,
      blend: 0,
    },
  },
  operations: [
    {
      id: 'left_face_slim', enabled: true, type: 'line_warp', target: 'left_jaw', strength: 0.09, radius: 1, falloff: { type: 'smoothstep' }, axis: { x: 1, y: 1 }, direction: { x: 0.045, y: 0 }, lineStart: { x: 0.25, y: 0.45 }, lineEnd: { x: 0.45, y: 0.72 }, width: 0.1, polygon: [],
      binding: { type: 'landmark_line', start: 'left_cheek', end: 'chin' },
    },
    {
      id: 'right_face_slim', enabled: true, type: 'line_warp', target: 'right_jaw', strength: 0.09, radius: 1, falloff: { type: 'smoothstep' }, axis: { x: 1, y: 1 }, direction: { x: -0.045, y: 0 }, lineStart: { x: 0.75, y: 0.45 }, lineEnd: { x: 0.55, y: 0.72 }, width: 0.1, polygon: [],
      binding: { type: 'landmark_line', start: 'right_cheek', end: 'chin' },
    },
    {
      id: 'jaw_region_refine', enabled: true, type: 'region_warp', target: 'jaw_region', strength: -0.03, radius: 1, falloff: { type: 'smoothstep' }, axis: { x: 1, y: 1 }, direction: { x: 0, y: -0.6 }, lineStart: { x: 0.3, y: 0.7 }, lineEnd: { x: 0.7, y: 0.7 }, width: 0.08,
      polygon: [{ x: 0.22, y: 0.62 }, { x: 0.78, y: 0.62 }, { x: 0.68, y: 0.88 }, { x: 0.32, y: 0.88 }],
      binding: { type: 'landmark_region', region: 'jaw_region' },
      weightMap: { type: 'radial_gradient', center: { x: 0.5, y: 0.76 }, radius: 0.32 },
    },
  ],
};
