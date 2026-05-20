import type { CurrentFace } from '../face';
import type { CurrentFaceGeometry } from '../geometry';
import type { FacePose } from './types';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toDegrees = (radians: number): number => radians * (180 / Math.PI);

const assertFinitePose = (pose: FacePose): void => {
  if (!Number.isFinite(pose.yaw) || !Number.isFinite(pose.pitch) || !Number.isFinite(pose.roll)) {
    throw new Error('FacePose calculation produced a non-finite value.');
  }
};

export function createFacePose(
  currentFace: CurrentFace,
  geometry: CurrentFaceGeometry,
): FacePose {
  if (currentFace.landmarkCount === 0 || currentFace.landmarks.length === 0) {
    throw new Error('CurrentFace does not include enough landmarks to create pose.');
  }

  if (geometry.width <= 0 || !Number.isFinite(geometry.width)) {
    throw new Error('CurrentFaceGeometry width must be positive to create pose.');
  }

  const { leftEye, rightEye, nose, mouth, chin } = geometry.parts;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeToMouth = Math.max(Math.abs(mouth.y - eyeCenterY), 0.0001);
  const mouthToChin = chin.y - mouth.y;

  const pose: FacePose = {
    yaw: clamp(((nose.x - geometry.center.x) / geometry.width) * 180, -90, 90),
    pitch: clamp(((mouthToChin / eyeToMouth) - 1) * 45, -90, 90),
    roll: clamp(toDegrees(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)), -180, 180),
  };

  assertFinitePose(pose);

  return pose;
}
