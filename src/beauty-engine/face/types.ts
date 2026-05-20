export type FacePoint3D = {
  x: number;
  y: number;
  z: number;
};

export type CurrentFace = {
  landmarks: FacePoint3D[];
  landmarkCount: number;
  detectedAt: number;
};

export type CurrentFaceSnapshot = {
  detected: boolean;
  landmarkCount: number;
  detectedAt: number | null;
};
