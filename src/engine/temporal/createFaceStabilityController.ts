export type FaceStabilityStatus = 'visible' | 'lost' | 'reacquiring';

export type FaceStabilitySnapshot = {
  status: FaceStabilityStatus;
  confidence: number;
  fade: number;
  isFaceDetected: boolean;
  lostFrameCount: number;
};

export type FaceStabilityController = {
  update: (isFaceDetected: boolean) => FaceStabilitySnapshot;
  reset: () => void;
  getSnapshot: () => FaceStabilitySnapshot;
};

type CreateFaceStabilityControllerOptions = {
  lostThresholdFrames?: number;
  fadeOutPerFrame?: number;
  fadeInPerFrame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function createFaceStabilityController({
  lostThresholdFrames = 4,
  fadeOutPerFrame = 0.08,
  fadeInPerFrame = 0.12,
}: CreateFaceStabilityControllerOptions = {}): FaceStabilityController {
  let lostFrameCount = 0;
  let fade = 1;
  let status: FaceStabilityStatus = 'visible';

  let snapshot: FaceStabilitySnapshot = {
    status,
    confidence: 1,
    fade,
    isFaceDetected: true,
    lostFrameCount,
  };

  const update = (isFaceDetected: boolean): FaceStabilitySnapshot => {
    if (isFaceDetected) {
      lostFrameCount = 0;
      status = fade < 0.999 ? 'reacquiring' : 'visible';
      fade = clamp01(fade + fadeInPerFrame);
      if (fade >= 0.999) {
        fade = 1;
        status = 'visible';
      }
    } else {
      lostFrameCount += 1;
      if (lostFrameCount >= lostThresholdFrames) {
        status = 'lost';
        fade = clamp01(fade - fadeOutPerFrame);
      }
    }

    snapshot = {
      status,
      confidence: fade,
      fade,
      isFaceDetected,
      lostFrameCount,
    };

    return snapshot;
  };

  return {
    update,
    reset: () => {
      lostFrameCount = 0;
      fade = 1;
      status = 'visible';
      snapshot = { status, confidence: 1, fade: 1, isFaceDetected: true, lostFrameCount: 0 };
    },
    getSnapshot: () => snapshot,
  };
}
