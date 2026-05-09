import { vi } from 'vitest';

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
  if (type === '2d') {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      createImageData: vi.fn((width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }

  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;
