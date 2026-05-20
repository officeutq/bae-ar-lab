import { createCurrentFace } from '../face';
import { createCurrentFaceGeometry } from '../geometry';
import type { FaceDetectionResult } from '../mediapipe';
import { createFacePose } from '../pose';
import type { FaceFrameAnalysis } from './types';

export function analyzeFaceFrame(
  detection: FaceDetectionResult | null,
  timestamp: number,
): FaceFrameAnalysis | null {
  if (detection === null) {
    return null;
  }

  const currentFace = createCurrentFace(detection, timestamp);
  const geometry = createCurrentFaceGeometry(currentFace);
  const pose = createFacePose(currentFace, geometry);

  return {
    currentFace,
    geometry,
    pose,
    analyzedAt: timestamp,
  };
}
