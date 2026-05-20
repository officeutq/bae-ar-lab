import { describe, expect, it } from 'vitest';

import type { FaceDetectionResult } from '../mediapipe';
import {
  FACE_LANDMARK_INDICES,
  MIN_FACE_GEOMETRY_LANDMARK_COUNT,
} from '../geometry';
import { analyzeFaceFrame } from './analyzeFaceFrame';

const createDetection = (): FaceDetectionResult => {
  const landmarks = Array.from(
    { length: MIN_FACE_GEOMETRY_LANDMARK_COUNT },
    () => ({ x: 0, y: 0, z: 0 }),
  );

  landmarks[FACE_LANDMARK_INDICES.leftFaceEdge] = { x: 0.1, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightFaceEdge] = { x: 0.9, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[0]] = { x: 0.3, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[1]] = { x: 0.4, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[0]] = { x: 0.6, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[1]] = { x: 0.7, y: 0.36, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.nose] = { x: 0.52, y: 0.5, z: -0.1 };
  landmarks[FACE_LANDMARK_INDICES.mouth[0]] = { x: 0.45, y: 0.7, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.mouth[1]] = { x: 0.55, y: 0.72, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.chin] = { x: 0.5, y: 0.92, z: 0 };

  return { landmarks };
};

describe('analyzeFaceFrame', () => {
  it('creates current face, geometry, and pose from detection', () => {
    const analysis = analyzeFaceFrame(createDetection(), 1234);

    expect(analysis).not.toBeNull();
    expect(analysis?.analyzedAt).toBe(1234);
    expect(analysis?.currentFace.landmarkCount).toBe(MIN_FACE_GEOMETRY_LANDMARK_COUNT);
    expect(analysis?.currentFace.detectedAt).toBe(1234);
    expect(analysis?.geometry.width).toBeGreaterThan(0);
    expect(Number.isFinite(analysis?.pose.yaw)).toBe(true);
    expect(Number.isFinite(analysis?.pose.pitch)).toBe(true);
    expect(Number.isFinite(analysis?.pose.roll)).toBe(true);
  });

  it('returns null when a face is not detected', () => {
    expect(analyzeFaceFrame(null, 1234)).toBeNull();
  });

  it('throws when landmarks are insufficient for analysis', () => {
    expect(() =>
      analyzeFaceFrame(
        {
          landmarks: [{ x: 0.5, y: 0.5, z: 0 }],
        },
        1234,
      ),
    ).toThrow('CurrentFace does not include enough landmarks to create geometry.');
  });
});
