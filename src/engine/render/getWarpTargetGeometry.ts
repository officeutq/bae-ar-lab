import type { WarpTarget } from '@app-types/preset';
import type { FaceGeometry, Point2D } from '@engine/geometry/types';

export type TargetGeometry = {
  center: Point2D;
  baseSize: number;
};

export function getWarpTargetGeometry(target: WarpTarget, geometry: FaceGeometry): TargetGeometry {
  const cheekBaseSize = geometry.faceWidth * 0.22;
  switch (target) {
    case 'left_eye':
      return { center: geometry.leftEyeCenter, baseSize: geometry.leftEyeWidth };
    case 'right_eye':
      return { center: geometry.rightEyeCenter, baseSize: geometry.rightEyeWidth };
    case 'mouth':
      return { center: geometry.mouthCenter, baseSize: geometry.mouthWidth };
    case 'nose':
      return { center: geometry.noseCenter, baseSize: geometry.faceWidth * 0.15 };
    case 'left_jaw':
      return { center: geometry.leftJawLine.start, baseSize: geometry.faceWidth * 0.3 };
    case 'right_jaw':
      return { center: geometry.rightJawLine.start, baseSize: geometry.faceWidth * 0.3 };
    case 'chin_line':
      return { center: geometry.chinLine.start, baseSize: geometry.faceWidth * 0.2 };
    case 'left_cheek':
      return { center: geometry.leftJawLine.start, baseSize: cheekBaseSize };
    case 'right_cheek':
      return { center: geometry.rightJawLine.start, baseSize: cheekBaseSize };
    case 'jaw_region':
      return { center: geometry.chinLine.start, baseSize: geometry.faceWidth * 0.35 };
    case 'face_center':
    default:
      return { center: geometry.faceCenter, baseSize: geometry.faceWidth };
  }
}
