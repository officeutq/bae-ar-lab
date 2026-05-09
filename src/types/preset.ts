export type WarpOperationType = 'radial_warp';

export type WarpTarget = 'left_eye' | 'right_eye' | 'face_center' | 'mouth' | 'nose';

export type WarpFalloffType = 'linear' | 'smoothstep' | 'gaussian';

export type WarpAxis = {
  x: number;
  y: number;
};

export type WarpFalloff = {
  type: WarpFalloffType;
};

export type WarpOperation = {
  id: string;
  enabled: boolean;
  type: WarpOperationType;
  target: WarpTarget;
  strength: number;
  radius: number;
  falloff: WarpFalloff;
  axis: WarpAxis;
};

export type WarpPreset = {
  version: number;
  operations: WarpOperation[];
};
