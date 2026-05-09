import type { FaceLandmarkPoint } from '@engine/mediapipe/types';
import type { ComputeFaceGeometryInput, FaceGeometry, Point2D } from './types';
import { computeFaceContourGeometry } from './computeFaceContourGeometry';

const INDEX = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  mouthLeft: 61,
  mouthRight: 291,
  noseTip: 1,
  leftCheek: 234,
  rightCheek: 454,
} as const;

function getPoint(landmarks: FaceLandmarkPoint[], index: number): Point2D | null {
  const point = landmarks[index];
  if (!point) {
    return null;
  }

  return { x: point.x, y: point.y };
}

function getCenter(points: Point2D[]): Point2D {
  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function getDistance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getBoundingCenter(landmarks: FaceLandmarkPoint[]): Point2D {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: (minX + maxX) * 0.5,
    y: (minY + maxY) * 0.5,
  };
}

export function computeFaceGeometry({ landmarks }: ComputeFaceGeometryInput): FaceGeometry | null {
  if (landmarks.length === 0) {
    return null;
  }

  const leftEyeOuter = getPoint(landmarks, INDEX.leftEyeOuter);
  const leftEyeInner = getPoint(landmarks, INDEX.leftEyeInner);
  const rightEyeInner = getPoint(landmarks, INDEX.rightEyeInner);
  const rightEyeOuter = getPoint(landmarks, INDEX.rightEyeOuter);
  const mouthLeft = getPoint(landmarks, INDEX.mouthLeft);
  const mouthRight = getPoint(landmarks, INDEX.mouthRight);
  const noseTip = getPoint(landmarks, INDEX.noseTip);
  const leftCheek = getPoint(landmarks, INDEX.leftCheek);
  const rightCheek = getPoint(landmarks, INDEX.rightCheek);

  if (
    !leftEyeOuter ||
    !leftEyeInner ||
    !rightEyeInner ||
    !rightEyeOuter ||
    !mouthLeft ||
    !mouthRight ||
    !noseTip ||
    !leftCheek ||
    !rightCheek
  ) {
    return null;
  }

  const leftEyeCenter = getCenter([leftEyeOuter, leftEyeInner]);
  const rightEyeCenter = getCenter([rightEyeOuter, rightEyeInner]);
  const mouthCenter = getCenter([mouthLeft, mouthRight]);
  const faceCenter = getBoundingCenter(landmarks);
  const contour = computeFaceContourGeometry(landmarks);

  if (!contour) {
    return null;
  }

  return {
    faceCenter,
    leftEyeCenter,
    rightEyeCenter,
    noseCenter: noseTip,
    mouthCenter,
    leftEyeWidth: getDistance(leftEyeOuter, leftEyeInner),
    rightEyeWidth: getDistance(rightEyeOuter, rightEyeInner),
    mouthWidth: getDistance(mouthLeft, mouthRight),
    faceWidth: getDistance(leftCheek, rightCheek),
    leftJawLine: contour.lines.leftJawLine,
    rightJawLine: contour.lines.rightJawLine,
    chinLine: contour.lines.chinLine,
  };
}
