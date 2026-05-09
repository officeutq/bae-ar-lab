export const RENDERER_BACKEND_MODES = ['canvas2d', 'cpu_warp_debug', 'webgl'] as const;

export type RendererBackendMode = (typeof RENDERER_BACKEND_MODES)[number];

export type RendererBackendState = 'idle' | 'running' | 'stopped';

/**
 * Renderer backend lifecycle contract used by runtime.
 *
 * stop() guarantees:
 * - Stops backend-owned RAF loops.
 * - No new frames are scheduled after stop.
 * - Safe to call during backend switching and camera stop.
 * - Idempotent (can be called multiple times safely).
 * - Releases backend-local resources/references as much as possible.
 */
export type RendererBackend = {
  readonly mode: RendererBackendMode;
  start: () => void;
  stop: () => void;
  getState: () => RendererBackendState;
};

export function getRendererModeLabel(mode: RendererBackendMode): string {
  switch (mode) {
    case 'canvas2d':
      return 'Canvas 2D';
    case 'cpu_warp_debug':
      return 'CPU Warp Debug';
    case 'webgl':
      return 'WebGL';
    default:
      return mode;
  }
}

export type RendererMode = RendererBackendMode;
