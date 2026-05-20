export const FACE_LANDMARK_INDICES = {
  leftFaceEdge: 234,
  rightFaceEdge: 454,
  leftEye: [33, 133],
  rightEye: [362, 263],
  nose: 1,
  mouth: [13, 14],
  chin: 152,
} as const;

const flattenIndices = (
  indices: ReadonlyArray<number | ReadonlyArray<number>>,
): number[] =>
  indices.flatMap((index) => (Array.isArray(index) ? [...index] : [index]));

export const REQUIRED_FACE_GEOMETRY_LANDMARK_INDICES = flattenIndices([
  FACE_LANDMARK_INDICES.leftFaceEdge,
  FACE_LANDMARK_INDICES.rightFaceEdge,
  FACE_LANDMARK_INDICES.leftEye,
  FACE_LANDMARK_INDICES.rightEye,
  FACE_LANDMARK_INDICES.nose,
  FACE_LANDMARK_INDICES.mouth,
  FACE_LANDMARK_INDICES.chin,
]);

export const MIN_FACE_GEOMETRY_LANDMARK_COUNT =
  Math.max(...REQUIRED_FACE_GEOMETRY_LANDMARK_INDICES) + 1;
