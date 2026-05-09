export type WarpOperationType = 'radial_warp' | 'directional_warp' | 'line_warp' | 'region_warp';

export type WarpTarget = 'left_eye' | 'right_eye' | 'face_center' | 'mouth' | 'nose' | 'left_jaw' | 'right_jaw' | 'chin_line';

export type LandmarkLinePoint = 'left_cheek' | 'right_cheek' | 'chin' | 'chin_left' | 'chin_right';

export type LandmarkLineBindingTarget = 'left_jaw' | 'right_jaw' | 'chin_line';

export type LandmarkLineBinding = {
  type: 'landmark_line';
  start: LandmarkLinePoint;
  end: LandmarkLinePoint;
};

export type WarpFalloffType = 'linear' | 'smoothstep' | 'gaussian';

export type WarpAxis = {
  x: number;
  y: number;
};

export type WarpDirection = {
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
  direction: WarpDirection;
  lineStart: WarpAxis;
  lineEnd: WarpAxis;
  width: number;
  polygon: WarpAxis[];
  binding?: LandmarkLineBinding;
};

export type WarpPreset = {
  version: number;
  operations: WarpOperation[];
};
