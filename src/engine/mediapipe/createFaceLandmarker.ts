import type { FaceLandmarkerController, FaceLandmarkerRuntimeState, FaceLandmarksFrame } from './types';

type VisionModule = {
  FilesetResolver: {
    forVisionTasks: (wasmRootPath: string) => Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions: (
      vision: unknown,
      options: {
        baseOptions: { modelAssetPath: string };
        runningMode: 'VIDEO';
        numFaces: number;
      },
    ) => Promise<FaceLandmarkerInstance>;
  };
};

type FaceLandmarkerInstance = {
  detectForVideo: (
    videoFrame: HTMLVideoElement,
    timestampMs: number,
  ) => {
    faceLandmarks?: Array<Array<unknown>>;
  };
  close: () => void;
};

const VISION_CDN_ESM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';
const WASM_ROOT_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function createFaceLandmarker(): FaceLandmarkerController {
  let state: FaceLandmarkerRuntimeState = 'idle';
  let faceLandmarker: FaceLandmarkerInstance | null = null;
  let frameCount = 0;

  const initialize = async () => {
    if (state === 'ready') {
      return;
    }

    state = 'loading';

    try {
      const visionModule = (await import(/* @vite-ignore */ VISION_CDN_ESM_URL)) as VisionModule;
      const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_ROOT_PATH);

      faceLandmarker = await visionModule.FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      state = 'ready';
    } catch {
      state = 'error';
      throw new Error('Failed to initialize MediaPipe Face Landmarker.');
    }
  };

  const detectForVideoFrame = (video: HTMLVideoElement, timestampMs: number): FaceLandmarksFrame => {
    if (!faceLandmarker) {
      throw new Error('Face Landmarker is not initialized.');
    }

    state = 'running';
    frameCount += 1;

    const result = faceLandmarker.detectForVideo(video, timestampMs);
    const firstFaceLandmarks = result.faceLandmarks?.[0] ?? [];

    return {
      detected: firstFaceLandmarks.length > 0,
      landmarkCount: firstFaceLandmarks.length,
      faceCount: result.faceLandmarks?.length ?? 0,
      timestampMs,
      frameCount,
    };
  };

  const getState = () => state;

  const dispose = () => {
    faceLandmarker?.close();
    faceLandmarker = null;
    frameCount = 0;
    state = 'idle';
  };

  return {
    initialize,
    detectForVideoFrame,
    getState,
    dispose,
  };
}
