import type { WarpTarget } from '@app-types/preset';
import type { FaceGeometry, Point2D } from '@engine/geometry/types';

export type TargetGeometry = {
  center: Point2D;
  baseSize: number;
};

export function getWarpTargetGeometry(target: WarpTarget, geometry: FaceGeometry): TargetGeometry {
  switch (target) {
    case 'left_eye':
      return { center: geometry.leftEyeCenter, baseSize: geometry.leftEyeWidth };
    case 'right_eye':
      return { center: geometry.rightEyeCenter, baseSize: geometry.rightEyeWidth };
    case 'mouth':
      return { center: geometry.mouthCenter, baseSize: geometry.mouthWidth };
    case 'nose':
      return { center: geometry.noseCenter, baseSize: geometry.faceWidth * 0.15 };
    case 'face_center':
    default:
      return { center: geometry.faceCenter, baseSize: geometry.faceWidth };
  }
}
