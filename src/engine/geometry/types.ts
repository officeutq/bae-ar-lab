import type { FaceLandmarkPoint } from '@engine/mediapipe/types';

export type Point2D = {
  x: number;
  y: number;
};

export type FaceGeometry = {
  faceCenter: Point2D;
  leftEyeCenter: Point2D;
  rightEyeCenter: Point2D;
  noseCenter: Point2D;
  mouthCenter: Point2D;
  leftEyeWidth: number;
  rightEyeWidth: number;
  mouthWidth: number;
  faceWidth: number;
};

export type ComputeFaceGeometryInput = {
  landmarks: FaceLandmarkPoint[];
};
