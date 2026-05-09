import { describe, expect, it } from 'vitest';
import { createCanvasRenderer } from './createCanvasRenderer';

function createRenderer(cpuWarpPreview = false) {
  const video = document.createElement('video');
  Object.defineProperty(video, 'videoWidth', { value: 640 });
  Object.defineProperty(video, 'videoHeight', { value: 360 });

  return createCanvasRenderer({
    video,
    canvas: document.createElement('canvas'),
    getCpuWarpPreviewEnabled: () => cpuWarpPreview,
    getActiveOperation: () => null,
    getOperations: () => [],
    getFaceGeometry: () => null,
  });
}

describe('createCanvasRenderer contract', () => {
  it('supports canvas2d contract and idempotent stop', () => {
    const renderer = createRenderer(false);
    renderer.start();
    renderer.stop();
    renderer.stop();
    renderer.stop();

    expect(renderer.mode).toBe('canvas2d');
    expect(renderer.getState()).toBe('stopped');
  });

  it('supports cpu_warp_debug path and idempotent stop', () => {
    const renderer = createRenderer(true);
    renderer.start();
    expect(() => renderer.stop()).not.toThrow();
    expect(() => renderer.stop()).not.toThrow();
    expect(renderer.getState()).toBe('stopped');
  });
});
