import { describe, expect, it } from 'vitest';

import type { CurrentFace } from '../face';
import { createCurrentFaceGeometry } from './createCurrentFaceGeometry';
import {
  FACE_LANDMARK_INDICES,
  MIN_FACE_GEOMETRY_LANDMARK_COUNT,
} from './landmarkIndices';

const createFace = (): CurrentFace => {
  const landmarks = Array.from(
    { length: MIN_FACE_GEOMETRY_LANDMARK_COUNT },
    () => ({ x: 0, y: 0, z: 0 }),
  );

  landmarks[FACE_LANDMARK_INDICES.leftFaceEdge] = { x: 0.1, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightFaceEdge] = { x: 0.9, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[0]] = { x: 0.3, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[1]] = { x: 0.4, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[0]] = { x: 0.6, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[1]] = { x: 0.7, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.nose] = { x: 0.5, y: 0.5, z: -0.1 };
  landmarks[FACE_LANDMARK_INDICES.mouth[0]] = { x: 0.45, y: 0.7, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.mouth[1]] = { x: 0.55, y: 0.72, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.chin] = { x: 0.5, y: 0.92, z: 0 };

  return {
    landmarks,
    landmarkCount: landmarks.length,
    detectedAt: 1234,
  };
};

describe('createCurrentFaceGeometry', () => {
  it('creates basic face geometry from current face landmarks', () => {
    const geometry = createCurrentFaceGeometry(createFace());

    expect(geometry.width).toBeGreaterThan(0);
    expect(geometry.center).toEqual({
      x: 0.5,
      y: 0.4775,
    });
    expect(geometry.parts.leftEye).toEqual({ x: 0.35, y: 0.35 });
    expect(geometry.parts.rightEye.x).toBeCloseTo(0.65);
    expect(geometry.parts.rightEye.y).toBe(0.35);
    expect(geometry.parts.nose).toEqual({ x: 0.5, y: 0.5 });
    expect(geometry.parts.mouth).toEqual({ x: 0.5, y: 0.71 });
    expect(geometry.parts.chin).toEqual({ x: 0.5, y: 0.92 });
  });

  it('throws when required landmarks are missing', () => {
    expect(() =>
      createCurrentFaceGeometry({
        landmarks: [],
        landmarkCount: 0,
        detectedAt: 1234,
      }),
    ).toThrow('CurrentFace does not include enough landmarks to create geometry.');
  });
});
