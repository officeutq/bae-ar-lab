import type { FaceDetectionResult } from '../mediapipe';
import type { CurrentFace } from './types';

export function createCurrentFace(
  detection: FaceDetectionResult,
  detectedAt: number,
): CurrentFace {
  if (detection.landmarks.length === 0) {
    throw new Error('Cannot create CurrentFace from an empty landmark set.');
  }

  const landmarks = detection.landmarks.map((landmark) => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }));

  return {
    landmarks,
    landmarkCount: landmarks.length,
    detectedAt,
  };
}
