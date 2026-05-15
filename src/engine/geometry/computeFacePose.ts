import type { FaceLandmarkPoint } from '@engine/mediapipe/types';
import type { FacePose, PoseAttenuation, Point2D } from './types';

const INDEX = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  noseTip: 1,
  chin: 152,
} as const;

const RAD_TO_DEG = 180 / Math.PI;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getPoint(landmarks: FaceLandmarkPoint[], index: number): Point2D | null {
  const point = landmarks[index];
  if (!point) return null;
  return { x: point.x, y: point.y };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function computeFacePose(landmarks: FaceLandmarkPoint[]): FacePose | null {
  const leftEyeOuter = getPoint(landmarks, INDEX.leftEyeOuter);
  const rightEyeOuter = getPoint(landmarks, INDEX.rightEyeOuter);
  const noseTip = getPoint(landmarks, INDEX.noseTip);
  const chin = getPoint(landmarks, INDEX.chin);

  if (!leftEyeOuter || !rightEyeOuter || !noseTip || !chin) {
    return null;
  }

  const eyeCenter = {
    x: (leftEyeOuter.x + rightEyeOuter.x) * 0.5,
    y: (leftEyeOuter.y + rightEyeOuter.y) * 0.5,
  };
  const eyeVector = {
    x: rightEyeOuter.x - leftEyeOuter.x,
    y: rightEyeOuter.y - leftEyeOuter.y,
  };
  const eyeDistance = Math.max(1e-6, Math.hypot(eyeVector.x, eyeVector.y));
  const eyeMidToNoseX = (noseTip.x - eyeCenter.x) / eyeDistance;

  const verticalCenterY = (eyeCenter.y + chin.y) * 0.5;
  const eyeToChinDistance = Math.max(1e-6, Math.abs(chin.y - eyeCenter.y));
  const noseVerticalOffset = (noseTip.y - verticalCenterY) / eyeToChinDistance;

  return {
    yaw: eyeMidToNoseX * 120,
    pitch: noseVerticalOffset * 160,
    roll: Math.atan2(eyeVector.y, eyeVector.x) * RAD_TO_DEG,
  };
}

export function computePoseAttenuation(pose: FacePose | null): PoseAttenuation {
  if (!pose) {
    return { factor: 1, yawFactor: 1, pitchFactor: 1 };
  }

  const yawAbs = Math.abs(pose.yaw);
  const pitchAbs = Math.abs(pose.pitch);
  const yawReduction = smoothstep(12, 35, yawAbs);
  const pitchReduction = smoothstep(14, 32, pitchAbs);

  const yawFactor = 1 - yawReduction * 0.7;
  const pitchFactor = 1 - pitchReduction * 0.35;

  return {
    factor: clamp01(yawFactor * pitchFactor),
    yawFactor,
    pitchFactor,
  };
}
