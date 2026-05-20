import type {
  BeautyEngine,
  BeautyEngineFrameInput,
  BeautyEngineInput,
  BeautyEngineLifecycleState,
  BeautyEngineOptions,
  BeautyEngineRuntimeSnapshot,
  BeautyPreset,
  IdealFace,
} from './types';
import type { CurrentFace, CurrentFaceSnapshot } from './face';
import type { CurrentFaceGeometry } from './geometry';
import type { FacePose } from './pose';
import { analyzeFaceFrame, type FaceFrameAnalysis } from './analysis';
import type { FaceLandmarkerAdapter } from './mediapipe';

type BeautyEngineInternalState = {
  lifecycleState: BeautyEngineLifecycleState;
  preset: BeautyPreset | null;
  idealFace: IdealFace | null;
  correctionStrength: number;
  input: BeautyEngineInput | null;
  startedAtMs: number | null;
  stoppedAtMs: number | null;
  disposedAtMs: number | null;
  currentFace: CurrentFace | null;
  currentFaceGeometry: CurrentFaceGeometry | null;
  facePose: FacePose | null;
  faceFrameAnalysis: FaceFrameAnalysis | null;
  faceLandmarkerAdapter: FaceLandmarkerAdapter | null;
  errors: string[];
};

const defaultClock = () => performance.now();

function normalizeCorrectionStrength(strength: number): number {
  if (!Number.isFinite(strength)) {
    return 0;
  }

  return Math.min(1, Math.max(0, strength));
}

function assertUsable(state: BeautyEngineInternalState): void {
  if (state.lifecycleState === 'disposed') {
    throw new Error('BeautyEngine has already been disposed.');
  }
}

function resetFaceAnalysis(state: BeautyEngineInternalState): void {
  state.currentFace = null;
  state.currentFaceGeometry = null;
  state.facePose = null;
  state.faceFrameAnalysis = null;
}

function recordError(state: BeautyEngineInternalState, error: unknown): void {
  state.errors.push(error instanceof Error ? error.message : String(error));
}

function createSnapshot(state: BeautyEngineInternalState): BeautyEngineRuntimeSnapshot {
  const currentFace: CurrentFaceSnapshot =
    state.currentFace === null
      ? {
          detected: false,
          landmarkCount: 0,
          detectedAt: null,
          hasGeometry: false,
          hasPose: false,
          analyzed: false,
        }
      : {
          detected: true,
          landmarkCount: state.currentFace.landmarkCount,
          detectedAt: state.currentFace.detectedAt,
          hasGeometry: state.currentFaceGeometry !== null,
          hasPose: state.facePose !== null,
          analyzed: state.faceFrameAnalysis !== null,
        };

  return {
    state: state.lifecycleState,
    lifecycleState: state.lifecycleState,
    hasInput: state.input !== null,
    hasPreset: state.preset !== null,
    hasIdealFace: state.idealFace !== null,
    presetId: state.preset?.id ?? null,
    idealFaceId: state.idealFace?.id ?? null,
    correctionStrength: state.correctionStrength,
    inputAttached: state.input !== null,
    outputAttached: state.input?.output !== undefined,
    startedAtMs: state.startedAtMs,
    stoppedAtMs: state.stoppedAtMs,
    disposedAtMs: state.disposedAtMs,
    currentFace,
    errors: [...state.errors],
  };
}

async function analyzeSingleFrame(
  state: BeautyEngineInternalState,
  input: BeautyEngineFrameInput,
): Promise<FaceFrameAnalysis | null> {
  assertUsable(state);

  if (!state.faceLandmarkerAdapter) {
    throw new Error('BeautyEngine requires a faceLandmarkerAdapter to analyze frames.');
  }

  await state.faceLandmarkerAdapter.initialize();

  const detection = state.faceLandmarkerAdapter.detect(input.video, input.timestamp);
  const analysis = analyzeFaceFrame(detection, input.timestamp);

  if (analysis === null) {
    resetFaceAnalysis(state);
    return null;
  }

  state.currentFace = analysis.currentFace;
  state.currentFaceGeometry = analysis.geometry;
  state.facePose = analysis.pose;
  state.faceFrameAnalysis = analysis;

  return analysis;
}

export function createBeautyEngine(options: BeautyEngineOptions = {}): BeautyEngine {
  const clock = options.clock ?? defaultClock;
  const state: BeautyEngineInternalState = {
    lifecycleState: 'idle',
    preset: options.initialPreset ?? null,
    idealFace: options.initialIdealFace ?? null,
    correctionStrength: normalizeCorrectionStrength(options.initialCorrectionStrength ?? 1),
    input: null,
    startedAtMs: null,
    stoppedAtMs: null,
    disposedAtMs: null,
    currentFace: null,
    currentFaceGeometry: null,
    facePose: null,
    faceFrameAnalysis: null,
    faceLandmarkerAdapter: options.faceLandmarkerAdapter ?? null,
    errors: [],
  };

  return {
    async start(input) {
      assertUsable(state);
      state.input = input;
      state.lifecycleState = 'running';
      state.startedAtMs = clock();
      state.stoppedAtMs = null;
    },

    async stop() {
      assertUsable(state);
      resetFaceAnalysis(state);

      if (state.lifecycleState !== 'running') {
        state.lifecycleState = 'idle';
        return;
      }

      state.lifecycleState = 'idle';
      state.stoppedAtMs = clock();
    },

    async dispose() {
      if (state.lifecycleState === 'disposed') {
        return;
      }

      await state.faceLandmarkerAdapter?.dispose();
      state.input = null;
      resetFaceAnalysis(state);
      state.lifecycleState = 'disposed';
      state.disposedAtMs = clock();
    },

    async analyzeFrame(input) {
      try {
        return await analyzeSingleFrame(state, input);
      } catch (error) {
        recordError(state, error);
        throw error;
      }
    },

    setPreset(preset) {
      assertUsable(state);
      state.preset = preset;
    },

    setIdealFace(idealFace) {
      assertUsable(state);
      state.idealFace = idealFace;
    },

    setCorrectionStrength(strength) {
      assertUsable(state);
      state.correctionStrength = normalizeCorrectionStrength(strength);
    },

    getRuntimeSnapshot() {
      return createSnapshot(state);
    },
  };
}
