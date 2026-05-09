import { describe, expect, it, vi } from 'vitest';
import { createRendererBackend } from './createRendererBackend';

vi.mock('@engine/webgl/createWebglRenderer', () => ({
  createWebglRenderer: vi.fn(() => ({
    mode: 'webgl' as const,
    start: vi.fn(),
    stop: vi.fn(),
    getState: () => 'idle' as const,
  })),
}));

function createBaseOptions(mode: 'canvas2d' | 'cpu_warp_debug' | 'webgl') {
  const video = document.createElement('video');
  Object.defineProperty(video, 'videoWidth', { value: 640 });
  Object.defineProperty(video, 'videoHeight', { value: 360 });

  const canvas2d = document.createElement('canvas');
  const webgl = document.createElement('canvas');

  return {
    mode,
    video,
    canvas2d,
    webgl,
    getOperations: () => [],
    getActiveOperation: () => null,
    getFaceGeometry: () => null,
    getSkinSmoothing: () => ({ enabled: false, strength: 0, radius: 0, maskOpacity: 0, showMaskPreview: false }),
    getSkinTone: () => ({ enabled: false, brightness: 0, saturation: 0, warmth: 0, blend: 0 }),
  };
}

describe('createRendererBackend', () => {
  it.each(['canvas2d', 'cpu_warp_debug', 'webgl'] as const)('creates %s backend contract', (mode) => {
    const renderer = createRendererBackend(createBaseOptions(mode));

    expect(renderer.mode).toBe(mode === 'cpu_warp_debug' ? 'canvas2d' : mode);
    expect(typeof renderer.stop).toBe('function');
    expect(typeof renderer.getState).toBe('function');
    expect(() => renderer.stop()).not.toThrow();
    expect(() => renderer.stop()).not.toThrow();
  });
});
