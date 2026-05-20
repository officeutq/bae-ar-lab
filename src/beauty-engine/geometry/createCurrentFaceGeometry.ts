import type { CurrentFace, FacePoint3D } from '../face';
import {
  FACE_LANDMARK_INDICES,
  MIN_FACE_GEOMETRY_LANDMARK_COUNT,
} from './landmarkIndices';
import type { CurrentFaceGeometry, FacePoint2D } from './types';

const toPoint2D = (point: FacePoint3D): FacePoint2D => ({
  x: point.x,
  y: point.y,
});

const averagePoints = (points: FacePoint2D[]): FacePoint2D => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

const distance = (first: FacePoint2D, second: FacePoint2D): number => {
  const dx = first.x - second.x;
  const dy = first.y - second.y;

  return Math.hypot(dx, dy);
};

const getPoint = (currentFace: CurrentFace, index: number): FacePoint2D => {
  const point = currentFace.landmarks[index];

  if (!point) {
    throw new Error('CurrentFace does not include enough landmarks to create geometry.');
  }

  return toPoint2D(point);
};

const getAveragePoint = (
  currentFace: CurrentFace,
  indices: readonly number[],
): FacePoint2D => averagePoints(indices.map((index) => getPoint(currentFace, index)));

export function createCurrentFaceGeometry(
  currentFace: CurrentFace,
): CurrentFaceGeometry {
  if (currentFace.landmarks.length < MIN_FACE_GEOMETRY_LANDMARK_COUNT) {
    throw new Error('CurrentFace does not include enough landmarks to create geometry.');
  }

  const leftFaceEdge = getPoint(currentFace, FACE_LANDMARK_INDICES.leftFaceEdge);
  const rightFaceEdge = getPoint(currentFace, FACE_LANDMARK_INDICES.rightFaceEdge);
  const leftEye = getAveragePoint(currentFace, FACE_LANDMARK_INDICES.leftEye);
  const rightEye = getAveragePoint(currentFace, FACE_LANDMARK_INDICES.rightEye);
  const nose = getPoint(currentFace, FACE_LANDMARK_INDICES.nose);
  const mouth = getAveragePoint(currentFace, FACE_LANDMARK_INDICES.mouth);
  const chin = getPoint(currentFace, FACE_LANDMARK_INDICES.chin);

  return {
    center: averagePoints([leftEye, rightEye, nose, mouth]),
    width: distance(leftFaceEdge, rightFaceEdge),
    parts: {
      leftEye,
      rightEye,
      nose,
      mouth,
      chin,
    },
  };
}
