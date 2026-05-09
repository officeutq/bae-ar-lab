export type FaceLandmarkerRuntimeState = 'idle' | 'loading' | 'ready' | 'running' | 'error';

export type FaceLandmarkPoint = {
  x: number;
  y: number;
  z: number;
};

export type FaceLandmarksFrame = {
  detected: boolean;
  landmarkCount: number;
  faceCount: number;
  timestampMs: number;
  frameCount: number;
  landmarks: FaceLandmarkPoint[];
};

export type FaceLandmarkerController = {
  initialize: () => Promise<void>;
  detectForVideoFrame: (video: HTMLVideoElement, timestampMs: number) => FaceLandmarksFrame;
  getState: () => FaceLandmarkerRuntimeState;
  dispose: () => void;
};
