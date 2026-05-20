export type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
};

export type FaceDetectionResult = {
  landmarks: NormalizedLandmark[];
};

export type FaceLandmarkerAdapter = {
  initialize(): Promise<void>;
  detect(video: HTMLVideoElement, timestamp: number): FaceDetectionResult | null;
  dispose(): Promise<void>;
};
