import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

import { FACE_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_BASE_URL } from '@config/mediapipeAssets';

import type { FaceDetectionResult, FaceLandmarkerAdapter, NormalizedLandmark } from './types';

type MediaPipeFaceLandmarker = {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
  };
  close(): void;
};

type AdapterState = 'idle' | 'initializing' | 'ready' | 'disposed';

const toNormalizedLandmarks = (
  landmarks: Array<{ x: number; y: number; z?: number }>,
): NormalizedLandmark[] =>
  landmarks.map((landmark) => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z ?? 0,
  }));

export function createFaceLandmarkerAdapter(): FaceLandmarkerAdapter {
  let state: AdapterState = 'idle';
  let faceLandmarker: MediaPipeFaceLandmarker | null = null;
  let initializePromise: Promise<void> | null = null;

  const assertNotDisposed = (): void => {
    if (state === 'disposed') {
      throw new Error('FaceLandmarkerAdapter has already been disposed.');
    }
  };

  const assertReady = (): MediaPipeFaceLandmarker => {
    assertNotDisposed();

    if (state !== 'ready' || faceLandmarker === null) {
      throw new Error('FaceLandmarkerAdapter is not initialized.');
    }

    return faceLandmarker;
  };

  return {
    async initialize() {
      assertNotDisposed();

      if (state === 'ready') {
        return;
      }

      if (initializePromise) {
        return initializePromise;
      }

      state = 'initializing';
      initializePromise = (async () => {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE_URL);
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL },
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        state = 'ready';
        initializePromise = null;
      })();

      return initializePromise;
    },

    detect(video, timestamp): FaceDetectionResult | null {
      const landmarker = assertReady();
      const result = landmarker.detectForVideo(video, timestamp);
      const landmarks = result.faceLandmarks?.[0];

      if (!landmarks || landmarks.length === 0) {
        return null;
      }

      return {
        landmarks: toNormalizedLandmarks(landmarks),
      };
    },

    async dispose() {
      if (state === 'disposed') {
        return;
      }

      faceLandmarker?.close();
      faceLandmarker = null;
      initializePromise = null;
      state = 'disposed';
    },
  };
}
