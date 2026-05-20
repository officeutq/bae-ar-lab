import type {
  BeautyEngine,
  BeautyEngineInput,
  BeautyEngineLifecycleState,
  BeautyEngineOptions,
  BeautyEngineRuntimeSnapshot,
  BeautyPreset,
  IdealFace,
} from './types';

type BeautyEngineInternalState = {
  lifecycleState: BeautyEngineLifecycleState;
  preset: BeautyPreset | null;
  idealFace: IdealFace | null;
  correctionStrength: number;
  input: BeautyEngineInput | null;
  startedAtMs: number | null;
  stoppedAtMs: number | null;
  disposedAtMs: number | null;
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

function createSnapshot(state: BeautyEngineInternalState): BeautyEngineRuntimeSnapshot {
  return {
    lifecycleState: state.lifecycleState,
    presetId: state.preset?.id ?? null,
    idealFaceId: state.idealFace?.id ?? null,
    correctionStrength: state.correctionStrength,
    inputAttached: state.input !== null,
    outputAttached: state.input?.output !== undefined,
    startedAtMs: state.startedAtMs,
    stoppedAtMs: state.stoppedAtMs,
    disposedAtMs: state.disposedAtMs,
  };
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
      if (state.lifecycleState !== 'running') {
        state.lifecycleState = 'stopped';
        return;
      }

      state.lifecycleState = 'stopped';
      state.stoppedAtMs = clock();
    },

    async dispose() {
      if (state.lifecycleState === 'disposed') {
        return;
      }

      state.input = null;
      state.lifecycleState = 'disposed';
      state.disposedAtMs = clock();
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
