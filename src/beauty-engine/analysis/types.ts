import type { CurrentFace } from '../face';
import type { CurrentFaceGeometry } from '../geometry';
import type { FacePose } from '../pose';

export type FaceFrameAnalysis = {
  currentFace: CurrentFace;
  geometry: CurrentFaceGeometry;
  pose: FacePose;
  analyzedAt: number;
};
