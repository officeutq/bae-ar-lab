import type { FaceLandmarkPoint } from '@engine/mediapipe/types';
import type { Point2D } from './types';

const CONTOUR_INDEX = {
  leftCheek: 234,
  rightCheek: 454,
  chin: 152,
  chinLeft: 172,
  chinRight: 397,
} as const;

function getPoint(landmarks: FaceLandmarkPoint[], index: number): Point2D | null {
  const point = landmarks[index];
  if (!point) return null;
  return { x: point.x, y: point.y };
}

export function computeFaceContourGeometry(landmarks: FaceLandmarkPoint[]) {
  const leftCheek = getPoint(landmarks, CONTOUR_INDEX.leftCheek);
  const rightCheek = getPoint(landmarks, CONTOUR_INDEX.rightCheek);
  const chin = getPoint(landmarks, CONTOUR_INDEX.chin);
  const chinLeft = getPoint(landmarks, CONTOUR_INDEX.chinLeft);
  const chinRight = getPoint(landmarks, CONTOUR_INDEX.chinRight);

  if (!leftCheek || !rightCheek || !chin || !chinLeft || !chinRight) {
    return null;
  }

  return {
    points: { leftCheek, rightCheek, chin, chinLeft, chinRight },
    lines: {
      leftJawLine: { start: leftCheek, end: chin },
      rightJawLine: { start: rightCheek, end: chin },
      chinLine: { start: chinLeft, end: chinRight },
    },
  };
}
