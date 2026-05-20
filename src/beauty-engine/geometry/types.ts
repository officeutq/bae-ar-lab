export type FacePoint2D = {
  x: number;
  y: number;
};

export type FacePartCenters = {
  leftEye: FacePoint2D;
  rightEye: FacePoint2D;
  nose: FacePoint2D;
  mouth: FacePoint2D;
  chin: FacePoint2D;
};

export type CurrentFaceGeometry = {
  center: FacePoint2D;
  width: number;
  parts: FacePartCenters;
};
