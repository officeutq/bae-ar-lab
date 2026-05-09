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


function drawDirectionArrow(context: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, length: number) {
  const mag = Math.hypot(dx, dy);
  if (mag < 0.0001) return;
  const nx = dx / mag;
  const ny = dy / mag;
  const tipX = x + nx * length;
  const tipY = y + ny * length;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(tipX, tipY);
  context.strokeStyle = 'rgba(120, 255, 180, 0.9)';
  context.lineWidth = 2;
  context.stroke();
  const head = Math.max(4, length * 0.2);
  context.beginPath();
  context.moveTo(tipX, tipY);
  context.lineTo(tipX - nx * head - ny * head * 0.6, tipY - ny * head + nx * head * 0.6);
  context.lineTo(tipX - nx * head + ny * head * 0.6, tipY - ny * head - nx * head * 0.6);
  context.closePath();
  context.fillStyle = 'rgba(120, 255, 180, 0.9)';
  context.fill();
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

    if (operation.type === 'line_warp') {
      const startX = clamp01(operation.lineStart.x) * canvas.width;
      const startY = clamp01(operation.lineStart.y) * canvas.height;
      const endX = clamp01(operation.lineEnd.x) * canvas.width;
      const endY = clamp01(operation.lineEnd.y) * canvas.height;
      const halfWidthPx = Math.max(1, operation.width * Math.min(canvas.width, canvas.height));
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.strokeStyle = 'rgba(255, 120, 40, 0.95)';
      context.lineWidth = 2;
      context.stroke();
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.strokeStyle = 'rgba(255, 180, 120, 0.25)';
      context.lineWidth = halfWidthPx * 2;
      context.stroke();
      drawDirectionArrow(context, (startX + endX) * 0.5, (startY + endY) * 0.5, operation.direction.x, operation.direction.y, halfWidthPx);
      return;
    }
    if (operation.type === 'region_warp') {
      const polygon = operation.polygon.map((point) => ({ x: clamp01(point.x) * canvas.width, y: clamp01(point.y) * canvas.height }));
      if (polygon.length < 3) return;
      context.beginPath();
      context.moveTo(polygon[0].x, polygon[0].y);
      polygon.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.closePath();
      context.fillStyle = 'rgba(255, 160, 80, 0.12)';
      context.fill();
      context.strokeStyle = 'rgba(255, 120, 40, 0.95)';
      context.lineWidth = 2;
      context.stroke();
      const center = polygon.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
      const cx = center.x / polygon.length;
      const cy = center.y / polygon.length;
      drawDirectionArrow(context, cx, cy, operation.direction.x, operation.direction.y, Math.max(16, operation.width * Math.min(canvas.width, canvas.height)));
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

    if (operation.type === 'directional_warp') {
      drawDirectionArrow(context, centerX, centerY, operation.direction.x, operation.direction.y, Math.min(radiusX, radiusY) * 0.9);
    }

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
