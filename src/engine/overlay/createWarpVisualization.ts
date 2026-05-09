import type { FaceGeometry, Point2D } from '@engine/geometry/types';
import type { WarpOperation, WarpTarget } from '@app-types/preset';

export type WarpVisualizationToggles = {
  showWarpInfluence: boolean;
  showWarpCenter: boolean;
  showFalloffRings: boolean;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const FALLBACK_SIZE = 0.05;
const RING_STEPS = [0.25, 0.5, 0.75, 1];

type TargetGeometry = {
  center: Point2D;
  baseSize: number;
};

function getTargetGeometry(target: WarpTarget, geometry: FaceGeometry): TargetGeometry {
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

function getFalloffAlpha(type: WarpOperation['falloff']['type'], distance01: number): number {
  const t = clamp01(distance01);
  if (type === 'linear') {
    return 1 - t;
  }
  if (type === 'gaussian') {
    return Math.exp(-5 * t * t);
  }
  return 1 - (3 * t * t - 2 * t * t * t);
}

export function createWarpVisualization(context: CanvasRenderingContext2D) {
  const draw = (
    canvas: HTMLCanvasElement,
    geometry: FaceGeometry,
    operation: WarpOperation,
    toggles: WarpVisualizationToggles,
  ) => {
    if (!operation.enabled || !toggles.showWarpInfluence) {
      return;
    }

    const target = getTargetGeometry(operation.target, geometry);
    const centerX = clamp01(target.center.x) * canvas.width;
    const centerY = clamp01(target.center.y) * canvas.height;
    const baseRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;
    const radiusX = Math.max(1, baseRadius * operation.axis.x * canvas.width);
    const radiusY = Math.max(1, baseRadius * operation.axis.y * canvas.height);

    if (toggles.showFalloffRings) {
      for (const step of RING_STEPS) {
        const alpha = Math.max(0.1, getFalloffAlpha(operation.falloff.type, step));
        context.beginPath();
        context.ellipse(centerX, centerY, radiusX * step, radiusY * step, 0, 0, Math.PI * 2);
        context.strokeStyle = `rgba(255, 120, 40, ${alpha.toFixed(3)})`;
        context.lineWidth = step === 1 ? 2 : 1;
        context.stroke();
      }
    } else {
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 120, 40, 0.85)';
      context.lineWidth = 2;
      context.stroke();
    }

    context.beginPath();
    context.moveTo(centerX - radiusX, centerY);
    context.lineTo(centerX + radiusX, centerY);
    context.moveTo(centerX, centerY - radiusY);
    context.lineTo(centerX, centerY + radiusY);
    context.strokeStyle = 'rgba(255, 180, 120, 0.65)';
    context.lineWidth = 1;
    context.stroke();

    if (toggles.showWarpCenter) {
      context.beginPath();
      context.arc(centerX, centerY, 4, 0, Math.PI * 2);
      context.fillStyle = '#ffb347';
      context.fill();
    }
  };

  return {
    draw,
  };
}
