import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFaceLandmarkerAdapter } from './createFaceLandmarkerAdapter';

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  detectForVideo: vi.fn(),
  forVisionTasks: vi.fn(),
  createFromOptions: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: mocks.forVisionTasks,
  },
  FaceLandmarker: {
    createFromOptions: mocks.createFromOptions,
  },
}));

const createVideo = () => document.createElement('video');

describe('createFaceLandmarkerAdapter', () => {
  beforeEach(() => {
    mocks.close.mockReset();
    mocks.detectForVideo.mockReset();
    mocks.forVisionTasks.mockReset();
    mocks.createFromOptions.mockReset();

    mocks.forVisionTasks.mockResolvedValue({ wasm: 'vision' });
    mocks.createFromOptions.mockResolvedValue({
      close: mocks.close,
      detectForVideo: mocks.detectForVideo,
    });
    mocks.detectForVideo.mockReturnValue({ faceLandmarks: [] });
  });

  it('initializes MediaPipe once when called repeatedly', async () => {
    const adapter = createFaceLandmarkerAdapter();

    await adapter.initialize();
    await adapter.initialize();

    expect(mocks.forVisionTasks).toHaveBeenCalledTimes(1);
    expect(mocks.createFromOptions).toHaveBeenCalledTimes(1);
  });

  it('throws when detect is called before initialize', () => {
    const adapter = createFaceLandmarkerAdapter();

    expect(() => adapter.detect(createVideo(), 100)).toThrow('FaceLandmarkerAdapter is not initialized.');
  });

  it('returns null when MediaPipe does not detect a face', async () => {
    const adapter = createFaceLandmarkerAdapter();
    await adapter.initialize();

    expect(adapter.detect(createVideo(), 100)).toBeNull();
  });

  it('returns normalized landmarks for the first detected face', async () => {
    const adapter = createFaceLandmarkerAdapter();
    mocks.detectForVideo.mockReturnValue({
      faceLandmarks: [
        [
          { x: 0.1, y: 0.2, z: -0.3 },
          { x: 0.4, y: 0.5 },
        ],
      ],
    });

    await adapter.initialize();

    expect(adapter.detect(createVideo(), 100)).toEqual({
      landmarks: [
        { x: 0.1, y: 0.2, z: -0.3 },
        { x: 0.4, y: 0.5, z: 0 },
      ],
    });
  });

  it('disposes safely when called repeatedly', async () => {
    const adapter = createFaceLandmarkerAdapter();

    await adapter.initialize();
    await adapter.dispose();
    await adapter.dispose();

    expect(mocks.close).toHaveBeenCalledTimes(1);
  });

  it('rejects detect after dispose', async () => {
    const adapter = createFaceLandmarkerAdapter();

    await adapter.initialize();
    await adapter.dispose();

    expect(() => adapter.detect(createVideo(), 100)).toThrow(
      'FaceLandmarkerAdapter has already been disposed.',
    );
  });
});
