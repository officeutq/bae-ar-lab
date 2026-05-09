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
  leftJawLine: { start: Point2D; end: Point2D };
  rightJawLine: { start: Point2D; end: Point2D };
  chinLine: { start: Point2D; end: Point2D };
  leftCheekPolygon: Point2D[];
  rightCheekPolygon: Point2D[];
  jawPolygon: Point2D[];
};

export type FacePose = {
  yaw: number;
  pitch: number;
  roll: number;
};

export type PoseAttenuation = {
  factor: number;
  yawFactor: number;
  pitchFactor: number;
};

export type ComputeFaceGeometryInput = {
  landmarks: FaceLandmarkPoint[];
};
