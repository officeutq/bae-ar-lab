import type { RendererBackend } from './types';

export function replaceRendererBackend(current: RendererBackend | null, createNext: () => RendererBackend): RendererBackend {
  current?.stop();
  return createNext();
}
