import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

import type {
  FaceLandmarkerController,
  FaceLandmarkerRuntimeState,
  FaceLandmarksFrame,
} from './types';

const WASM_ROOT_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function createFaceLandmarker(): FaceLandmarkerController {
  let state: FaceLandmarkerRuntimeState = 'idle';
  let faceLandmarker: FaceLandmarker | null = null;
  let frameCount = 0;

  const initialize = async () => {
    if (state === 'ready') {
      return;
    }

    state = 'loading';

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT_PATH);

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
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
      landmarks: firstFaceLandmarks,
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
