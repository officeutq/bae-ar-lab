import type { WarpOperation, WarpTarget } from '@app-types/preset';
import type { FaceGeometry, Point2D } from '@engine/geometry/types';
import { applyRadialWarp } from '@engine/math/warp/applyRadialWarp';

const FALLBACK_SIZE = 0.05;
const PREVIEW_WIDTH = 320;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

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

export type CpuWarpRenderInput = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  operation: WarpOperation | null;
  geometry: FaceGeometry | null;
};

export function createCpuWarpRenderer() {
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });

  if (!sourceContext) {
    throw new Error('2D offscreen context is not available.');
  }

  const render = ({ video, canvas, context, operation, geometry }: CpuWarpRenderInput) => {
    const { videoWidth, videoHeight } = video;
    if (videoWidth === 0 || videoHeight === 0) {
      return;
    }

    const scale = PREVIEW_WIDTH / videoWidth;
    const targetWidth = Math.max(1, Math.round(PREVIEW_WIDTH));
    const targetHeight = Math.max(1, Math.round(videoHeight * scale));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    if (sourceCanvas.width !== targetWidth || sourceCanvas.height !== targetHeight) {
      sourceCanvas.width = targetWidth;
      sourceCanvas.height = targetHeight;
    }

    sourceContext.drawImage(video, 0, 0, targetWidth, targetHeight);

    if (!operation?.enabled || !geometry) {
      context.clearRect(0, 0, targetWidth, targetHeight);
      context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
      return;
    }

    const sourceData = sourceContext.getImageData(0, 0, targetWidth, targetHeight);
    const outputData = sourceContext.createImageData(targetWidth, targetHeight);
    const src = sourceData.data;
    const dst = outputData.data;

    const target = getTargetGeometry(operation.target, geometry);
    const warpCenter = { x: clamp01(target.center.x), y: clamp01(target.center.y) };
    const warpRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;

    for (let y = 0; y < targetHeight; y += 1) {
      const v = y / Math.max(1, targetHeight - 1);
      for (let x = 0; x < targetWidth; x += 1) {
        const u = x / Math.max(1, targetWidth - 1);
        const warped = applyRadialWarp({
          uv: { x: u, y: v },
          center: warpCenter,
          radius: warpRadius,
          strength: operation.strength,
          axis: operation.axis,
          falloff: operation.falloff.type,
        });

        const sx = Math.round(clamp01(warped.warpedUv.x) * (targetWidth - 1));
        const sy = Math.round(clamp01(warped.warpedUv.y) * (targetHeight - 1));
        const srcIndex = (sy * targetWidth + sx) * 4;
        const dstIndex = (y * targetWidth + x) * 4;

        dst[dstIndex] = src[srcIndex];
        dst[dstIndex + 1] = src[srcIndex + 1];
        dst[dstIndex + 2] = src[srcIndex + 2];
        dst[dstIndex + 3] = src[srcIndex + 3];
      }
    }

    context.putImageData(outputData, 0, 0);
  };

  return { render };
}
