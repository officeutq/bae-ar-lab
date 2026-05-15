export type ProfilerPhase = 'frame' | 'mediapipe' | 'render';

export type ProfilerSnapshot = {
  fps: number;
  avgFps30: number;
  fpsSampleCount: number;
  frameTimeMs: number;
  avgFrameTimeMs30: number;
  mediapipeMs: number;
  renderMs: number;
  backend: string;
  operationCount: number;
  timestamp: number;
};

type CreateProfilerOptions = {
  sampleWindow?: number;
};

export type Profiler = {
  markPhaseStart: (phase: ProfilerPhase) => void;
  markPhaseEnd: (phase: ProfilerPhase) => number;
  setBackend: (backend: string) => void;
  setOperationCount: (count: number) => void;
  commitFrame: () => ProfilerSnapshot;
  reset: () => void;
  getSnapshot: () => ProfilerSnapshot;
};

export function createProfiler({ sampleWindow = 30 }: CreateProfilerOptions = {}): Profiler {
  const phaseStartTimes: Partial<Record<ProfilerPhase, number>> = {};
  const frameDurations: number[] = [];
  let backend = 'unknown';
  let operationCount = 0;
  let latestMediapipeMs = 0;
  let latestRenderMs = 0;
  let lastFrameTimestamp: number | null = null;

  let snapshot: ProfilerSnapshot = {
    fps: 0,
    avgFps30: 0,
    fpsSampleCount: 0,
    frameTimeMs: 0,
    avgFrameTimeMs30: 0,
    mediapipeMs: 0,
    renderMs: 0,
    backend,
    operationCount,
    timestamp: performance.now(),
  };

  const mean = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

  const markPhaseStart = (phase: ProfilerPhase) => {
    phaseStartTimes[phase] = performance.now();
  };

  const markPhaseEnd = (phase: ProfilerPhase) => {
    const start = phaseStartTimes[phase];
    if (typeof start !== 'number') return 0;
    const duration = Math.max(0, performance.now() - start);
    if (phase === 'mediapipe') latestMediapipeMs = duration;
    if (phase === 'render') latestRenderMs = duration;
    return duration;
  };

  const commitFrame = () => {
    const now = performance.now();
    const frameTime = lastFrameTimestamp === null ? 0 : Math.max(0, now - lastFrameTimestamp);
    lastFrameTimestamp = now;

    if (frameTime > 0) {
      frameDurations.push(frameTime);
      if (frameDurations.length > sampleWindow) frameDurations.shift();
    }

    const avgFrameTime = mean(frameDurations);
    snapshot = {
      fps: frameTime > 0 ? 1000 / frameTime : 0,
      avgFps30: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      fpsSampleCount: frameDurations.length,
      frameTimeMs: frameTime,
      avgFrameTimeMs30: avgFrameTime,
      mediapipeMs: latestMediapipeMs,
      renderMs: latestRenderMs,
      backend,
      operationCount,
      timestamp: now,
    };

    return snapshot;
  };

  return {
    markPhaseStart,
    markPhaseEnd,
    setBackend: (value: string) => { backend = value; },
    setOperationCount: (count: number) => { operationCount = count; },
    commitFrame,
    reset: () => {
      frameDurations.length = 0;
      latestMediapipeMs = 0;
      latestRenderMs = 0;
      lastFrameTimestamp = null;
    },
    getSnapshot: () => snapshot,
  };
}
