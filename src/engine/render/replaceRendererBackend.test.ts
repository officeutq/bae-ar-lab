import { describe, expect, it, vi } from 'vitest';
import { replaceRendererBackend } from './replaceRendererBackend';

describe('replaceRendererBackend', () => {
  it('stops current backend before creating next backend', () => {
    const stop = vi.fn();
    const current = { mode: 'canvas2d' as const, start: vi.fn(), stop, getState: () => 'running' as const };
    const next = { mode: 'webgl' as const, start: vi.fn(), stop: vi.fn(), getState: () => 'idle' as const };
    const createNext = vi.fn(() => next);

    const replaced = replaceRendererBackend(current, createNext);

    expect(stop).toHaveBeenCalledTimes(1);
    expect(createNext).toHaveBeenCalledTimes(1);
    expect(replaced).toBe(next);
  });

  it('is safe with same mode replacement and null current backend', () => {
    const next = { mode: 'canvas2d' as const, start: vi.fn(), stop: vi.fn(), getState: () => 'idle' as const };

    expect(() => replaceRendererBackend(null, () => next)).not.toThrow();
    const replaced = replaceRendererBackend(next, () => next);

    expect(replaced).toBe(next);
  });
});
