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
      direction: {
        x: 0,
        y: 0,
      },
      lineStart: { x: 0.3, y: 0.5 },
      lineEnd: { x: 0.7, y: 0.5 },
      width: 0.12,
    },
    {
      id: 'right_eye_enlarge',
      enabled: true,
      type: 'radial_warp',
      target: 'right_eye',
      strength: 0.08,
      radius: 1.8,
      falloff: {
        type: 'smoothstep',
      },
      axis: {
        x: 1,
        y: 0.7,
      },
      direction: {
        x: 0,
        y: 0,
      },
      lineStart: { x: 0.3, y: 0.5 },
      lineEnd: { x: 0.7, y: 0.5 },
      width: 0.12,
    },
    {
      id: 'left_face_slim',
      enabled: true,
      type: 'line_warp',
      target: 'left_jaw',
      strength: 0.05,
      radius: 1,
      falloff: { type: 'smoothstep' },
      axis: { x: 1, y: 1 },
      direction: { x: 0.03, y: 0 },
      lineStart: { x: 0.25, y: 0.45 },
      lineEnd: { x: 0.45, y: 0.72 },
      width: 0.09,
      binding: {
        type: 'landmark_line',
        start: 'left_cheek',
        end: 'chin',
      },
    },
    {
      id: 'right_face_slim',
      enabled: true,
      type: 'line_warp',
      target: 'right_jaw',
      strength: 0.05,
      radius: 1,
      falloff: { type: 'smoothstep' },
      axis: { x: 1, y: 1 },
      direction: { x: -0.03, y: 0 },
      lineStart: { x: 0.75, y: 0.45 },
      lineEnd: { x: 0.55, y: 0.72 },
      width: 0.09,
      binding: {
        type: 'landmark_line',
        start: 'right_cheek',
        end: 'chin',
      },
    },
  ],
};
