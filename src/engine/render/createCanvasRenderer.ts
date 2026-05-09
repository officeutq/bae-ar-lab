import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { createCpuWarpRenderer } from './createCpuWarpRenderer';

export type CanvasRendererState = 'idle' | 'running' | 'stopped';

export type CanvasRenderer = {
  start: () => void;
  stop: () => void;
  getState: () => CanvasRendererState;
};

type CreateCanvasRendererOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  getCpuWarpPreviewEnabled?: () => boolean;
  getActiveOperation?: () => WarpOperation | null;
  getOperations?: () => WarpOperation[];
  getFaceGeometry?: () => FaceGeometry | null;
  onRenderFrame?: (renderTimeMs: number) => void;
  getRenderScale?: () => number;
  getFrameSkip?: () => number;
};

export function createCanvasRenderer({
  video,
  canvas,
  getCpuWarpPreviewEnabled,
  getActiveOperation,
  getFaceGeometry,
  getOperations,
  onRenderFrame,
  getRenderScale,
  getFrameSkip,
}: CreateCanvasRendererOptions): CanvasRenderer {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D canvas context is not available.');
  }

  let animationFrameId: number | null = null;
  let state: CanvasRendererState = 'idle';
  let frameCounter = 0;
  const cpuWarpRenderer = createCpuWarpRenderer();

  const syncCanvasSize = () => {
    const { videoWidth, videoHeight } = video;

    if (videoWidth === 0 || videoHeight === 0) {
      return false;
    }

    const scale = Math.max(0.3, Math.min(1, getRenderScale?.() ?? 1));
    const scaledWidth = Math.max(1, Math.floor(videoWidth * scale));
    const scaledHeight = Math.max(1, Math.floor(videoHeight * scale));

    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
    }

    return true;
  };

  const renderFrame = () => {
    if (state !== 'running') {
      return;
    }

    const hasSize = syncCanvasSize();
    const frameSkip = Math.max(0, getFrameSkip?.() ?? 0);
    const shouldSkip = frameSkip > 0 && frameCounter % (frameSkip + 1) !== 0;
    frameCounter += 1;

    if (hasSize && !shouldSkip) {
      const renderStart = performance.now();
      if (getCpuWarpPreviewEnabled?.()) {
        const activeOperation = getActiveOperation?.() ?? null;
        const operations = getOperations?.() ?? (activeOperation ? [activeOperation] : []);

        cpuWarpRenderer.render({
          video,
          canvas,
          context,
          operations,
          geometry: getFaceGeometry?.() ?? null,
        });
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      onRenderFrame?.(performance.now() - renderStart);
    }

    animationFrameId = window.requestAnimationFrame(renderFrame);
  };

  const start = () => {
    if (state === 'running') {
      return;
    }

    state = 'running';
    animationFrameId = window.requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    state = 'stopped';
  };

  const getState = () => state;

  return {
    start,
    stop,
    getState,
  };
}
