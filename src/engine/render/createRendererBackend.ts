import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { createWebglRenderer } from '@engine/webgl/createWebglRenderer';
import { createCanvasRenderer } from './createCanvasRenderer';
import type { RendererBackend, RendererBackendMode } from './types';

type SharedOptions = {
  video: HTMLVideoElement;
  getOperations: () => WarpOperation[];
  getActiveOperation: () => WarpOperation | null;
  getFaceGeometry: () => FaceGeometry | null;
  onRenderFrame?: (renderTimeMs: number) => void;
  getRenderScale?: () => number;
  getFrameSkip?: () => number;
};

export type CreateRendererBackendOptions = SharedOptions & {
  mode: RendererBackendMode;
  canvas2d: HTMLCanvasElement;
  webgl: HTMLCanvasElement;
  getSkinSmoothing: () => { enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean };
  getSkinTone: () => { enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number };
  getSmoothingSampleCount?: () => number;
};

export function createRendererBackend(options: CreateRendererBackendOptions): RendererBackend {
  if (options.mode === 'webgl') {
    return createWebglRenderer({
      video: options.video,
      canvas: options.webgl,
      getOperations: options.getOperations,
      getFaceGeometry: options.getFaceGeometry,
      getSkinSmoothing: options.getSkinSmoothing,
      getSkinTone: options.getSkinTone,
      onRenderFrame: options.onRenderFrame,
      getRenderScale: options.getRenderScale,
      getFrameSkip: options.getFrameSkip,
      getSmoothingSampleCount: options.getSmoothingSampleCount,
    });
  }

  return createCanvasRenderer({
    video: options.video,
    canvas: options.canvas2d,
    getCpuWarpPreviewEnabled: () => options.mode === 'cpu_warp_debug',
    getProcessedDebugMarkerEnabled: () => options.mode !== 'webgl',
    getActiveOperation: options.getActiveOperation,
    getFaceGeometry: options.getFaceGeometry,
    getOperations: options.getOperations,
    onRenderFrame: options.onRenderFrame,
    getRenderScale: options.getRenderScale,
    getFrameSkip: options.getFrameSkip,
  });
}
