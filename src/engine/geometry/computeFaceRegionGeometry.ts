import type { FaceLandmarkPoint } from '@engine/mediapipe/types';
import type { Point2D } from './types';

const REGION_INDEX = {
  leftCheek: [234, 116, 123, 50, 187, 205],
  rightCheek: [454, 345, 352, 280, 411, 425],
  jaw: [234, 172, 136, 152, 365, 397, 454],
} as const;

function getPoint(landmarks: FaceLandmarkPoint[], index: number): Point2D | null {
  const point = landmarks[index];
  if (!point) return null;
  return { x: point.x, y: point.y };
}

function getPolygon(landmarks: FaceLandmarkPoint[], indices: readonly number[]): Point2D[] | null {
  const points: Point2D[] = [];
  for (const index of indices) {
    const point = getPoint(landmarks, index);
    if (!point) return null;
    points.push(point);
  }
  return points;
}

export function computeFaceRegionGeometry(landmarks: FaceLandmarkPoint[]) {
  const leftCheekPolygon = getPolygon(landmarks, REGION_INDEX.leftCheek);
  const rightCheekPolygon = getPolygon(landmarks, REGION_INDEX.rightCheek);
  const jawPolygon = getPolygon(landmarks, REGION_INDEX.jaw);

  if (!leftCheekPolygon || !rightCheekPolygon || !jawPolygon) {
    return null;
  }

  return {
    leftCheekPolygon,
    rightCheekPolygon,
    jawPolygon,
  };
}
