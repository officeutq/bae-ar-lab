export type CanvasRendererState = 'idle' | 'running' | 'stopped';

export type CanvasRenderer = {
  start: () => void;
  stop: () => void;
  getState: () => CanvasRendererState;
};

type CreateCanvasRendererOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
};

export function createCanvasRenderer({ video, canvas }: CreateCanvasRendererOptions): CanvasRenderer {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D canvas context is not available.');
  }

  let animationFrameId: number | null = null;
  let state: CanvasRendererState = 'idle';

  const syncCanvasSize = () => {
    const { videoWidth, videoHeight } = video;

    if (videoWidth === 0 || videoHeight === 0) {
      return false;
    }

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    return true;
  };

  const renderFrame = () => {
    if (state !== 'running') {
      return;
    }

    const hasSize = syncCanvasSize();

    if (hasSize) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
