export const RENDERER_MODES = ['canvas2d', 'cpu_warp_debug', 'webgl'] as const;

export type RendererMode = (typeof RENDERER_MODES)[number];

export function getRendererModeLabel(mode: RendererMode): string {
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
