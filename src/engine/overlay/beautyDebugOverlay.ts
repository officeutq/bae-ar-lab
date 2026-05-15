import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry, Point2D } from '@engine/geometry/types';

export type BeautyDebugOverlayMode = 'off' | 'skin_mask' | 'warp_influence' | 'attenuation' | 'stability';

export type BeautyDebugOverlaySnapshot = {
  mode: BeautyDebugOverlayMode;
  faceGeometry: FaceGeometry | null;
  operations: WarpOperation[];
  poseAttenuationFactor: number;
  faceStabilityFade: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const drawPolygon = (context: CanvasRenderingContext2D, polygon: Point2D[]) => {
  if (polygon.length < 3) return;
  context.beginPath();
  context.moveTo(polygon[0].x, polygon[0].y);
  polygon.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
};

const toCanvasPoint = (canvas: HTMLCanvasElement, point: Point2D): Point2D => ({
  x: clamp01(point.x) * canvas.width,
  y: clamp01(point.y) * canvas.height,
});

const resolveLineWarpPoints = (operation: WarpOperation, geometry: FaceGeometry): { start: Point2D; end: Point2D } => {
  if (operation.binding?.type === 'landmark_line') {
    return {
      start: operation.lineStart,
      end: operation.lineEnd,
    };
  }

  if (operation.target === 'left_jaw') {
    return {
      start: geometry.leftJawLine.start,
      end: geometry.leftJawLine.end,
    };
  }

  if (operation.target === 'right_jaw') {
    return {
      start: geometry.rightJawLine.start,
      end: geometry.rightJawLine.end,
    };
  }

  if (operation.target === 'chin_line') {
    return {
      start: geometry.chinLine.start,
      end: geometry.chinLine.end,
    };
  }

  return {
    start: operation.lineStart,
    end: operation.lineEnd,
  };
};

const resolveRegionWarpPolygon = (operation: WarpOperation, geometry: FaceGeometry): Point2D[] | null => {
  if (operation.binding?.type === 'landmark_region') {
    if (operation.binding.region === 'jaw_region') return geometry.jawPolygon;
    if (operation.binding.region === 'left_cheek') return geometry.leftCheekPolygon;
    if (operation.binding.region === 'right_cheek') return geometry.rightCheekPolygon;
  }

  if (operation.target === 'jaw_region') {
    return geometry.jawPolygon;
  }

  if (operation.target === 'left_cheek') return geometry.leftCheekPolygon;
  if (operation.target === 'right_cheek') return geometry.rightCheekPolygon;

  return null;
};

const faceMaskFromGeometry = (geometry: FaceGeometry): Point2D[] => {
  const region = [...geometry.leftCheekPolygon, ...[...geometry.rightCheekPolygon].reverse()];
  if (region.length >= 6) return region;
  return [
    geometry.leftJawLine.start,
    geometry.chinLine.start,
    geometry.rightJawLine.end,
    geometry.rightJawLine.start,
    geometry.faceCenter,
    geometry.leftJawLine.start,
  ];
};

export function renderBeautyDebugOverlay(canvas: HTMLCanvasElement, snapshot: BeautyDebugOverlaySnapshot) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.save();
  try {
    context.globalAlpha = 1;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (snapshot.mode === 'off') return;

    const geometry = snapshot.faceGeometry;
    if (snapshot.mode === 'skin_mask') {
      if (!geometry) return;
      const polygon = faceMaskFromGeometry(geometry).map((point) => toCanvasPoint(canvas, point));
      drawPolygon(context, polygon);
      context.fillStyle = 'rgba(32, 80, 180, 0.34)';
      context.fill();
      return;
    }

    if (snapshot.mode === 'warp_influence') {
      if (!geometry) return;
      snapshot.operations.filter((operation) => operation.enabled).forEach((operation) => {
      const alpha = 0.18 + Math.min(0.6, Math.abs(operation.strength) * 6);
      context.strokeStyle = `rgba(255, 165, 64, ${alpha.toFixed(3)})`;
      context.fillStyle = `rgba(255, 165, 64, ${(alpha * 0.4).toFixed(3)})`;
      context.lineWidth = 2;
      if (operation.type === 'line_warp') {
        const { start: resolvedStart, end: resolvedEnd } = resolveLineWarpPoints(operation, geometry);
        const start = toCanvasPoint(canvas, resolvedStart);
        const end = toCanvasPoint(canvas, resolvedEnd);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.lineWidth = Math.max(2, operation.width * Math.min(canvas.width, canvas.height) * 2);
        context.stroke();
        return;
      }
      if (operation.type === 'region_warp') {
        const resolvedPolygon = resolveRegionWarpPolygon(operation, geometry);
        if (!resolvedPolygon || resolvedPolygon.length < 3) {
          return;
        }
        const polygon = resolvedPolygon.map((point) => toCanvasPoint(canvas, point));
        drawPolygon(context, polygon);
        context.fill();
        context.stroke();
        return;
      }
      const target = operation.target === 'left_eye' ? geometry.leftEyeCenter
        : operation.target === 'right_eye' ? geometry.rightEyeCenter
          : operation.target === 'mouth' ? geometry.mouthCenter
            : operation.target === 'nose' ? geometry.noseCenter
              : geometry.faceCenter;
      const baseSize = operation.target === 'left_eye' ? geometry.leftEyeWidth
        : operation.target === 'right_eye' ? geometry.rightEyeWidth
          : operation.target === 'mouth' ? geometry.mouthWidth
            : operation.target === 'nose' ? geometry.faceWidth * 0.15
              : geometry.faceWidth;
      const center = toCanvasPoint(canvas, target);
      const radiusX = Math.max(4, baseSize * operation.radius * operation.axis.x * canvas.width);
      const radiusY = Math.max(4, baseSize * operation.radius * operation.axis.y * canvas.height);
      context.beginPath();
      context.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      });
      return;
    }

    if (snapshot.mode === 'attenuation') {
      const weakened = 1 - clamp01(snapshot.poseAttenuationFactor);
      if (weakened <= 0.001) return;
      context.fillStyle = `rgba(255, 220, 64, ${(0.18 + weakened * 0.55).toFixed(3)})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (snapshot.mode === 'stability') {
      const unstable = 1 - clamp01(snapshot.faceStabilityFade);
      if (unstable <= 0.001) return;
      context.fillStyle = `rgba(255, 64, 64, ${(0.2 + unstable * 0.6).toFixed(3)})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  } finally {
    context.restore();
  }
}
