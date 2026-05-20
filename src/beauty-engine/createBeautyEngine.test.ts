import { describe, expect, it } from 'vitest';
import { createBeautyEngine } from './createBeautyEngine';
import {
  FACE_LANDMARK_INDICES,
  MIN_FACE_GEOMETRY_LANDMARK_COUNT,
} from './geometry';
import type { FaceDetectionResult, FaceLandmarkerAdapter } from './mediapipe';
import type { BeautyPreset, IdealFace } from './types';

const createInput = () => ({
  source: document.createElement('canvas'),
});

const createPreset = (): BeautyPreset => ({
  schemaVersion: 1,
  id: 'minimal_test_preset',
  name: 'Minimal Test Preset',
  operations: [],
});

const createIdealFace = (): IdealFace => ({
  schemaVersion: 1,
  id: 'minimal_test_ideal_face',
  name: 'Minimal Test Ideal Face',
  landmarks: [],
});

const createVideo = () => document.createElement('video');

const createDetection = (): FaceDetectionResult => {
  const landmarks = Array.from(
    { length: MIN_FACE_GEOMETRY_LANDMARK_COUNT },
    () => ({ x: 0, y: 0, z: 0 }),
  );

  landmarks[FACE_LANDMARK_INDICES.leftFaceEdge] = { x: 0.1, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightFaceEdge] = { x: 0.9, y: 0.5, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[0]] = { x: 0.3, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.leftEye[1]] = { x: 0.4, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[0]] = { x: 0.6, y: 0.35, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.rightEye[1]] = { x: 0.7, y: 0.36, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.nose] = { x: 0.52, y: 0.5, z: -0.1 };
  landmarks[FACE_LANDMARK_INDICES.mouth[0]] = { x: 0.45, y: 0.7, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.mouth[1]] = { x: 0.55, y: 0.72, z: 0 };
  landmarks[FACE_LANDMARK_INDICES.chin] = { x: 0.5, y: 0.92, z: 0 };

  return { landmarks };
};

const createAdapter = (
  detection: FaceDetectionResult | null,
): FaceLandmarkerAdapter & {
  initializeCalls: number;
  detectCalls: number;
  disposeCalls: number;
} => ({
  initializeCalls: 0,
  detectCalls: 0,
  disposeCalls: 0,
  async initialize() {
    this.initializeCalls += 1;
  },
  detect() {
    this.detectCalls += 1;
    return detection;
  },
  async dispose() {
    this.disposeCalls += 1;
  },
});

describe('createBeautyEngine', () => {
  it('starts idle with unset input, preset, and ideal face', () => {
    const engine = createBeautyEngine();

    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'idle',
      lifecycleState: 'idle',
      hasInput: false,
      hasPreset: false,
      hasIdealFace: false,
      inputAttached: false,
      presetId: null,
      idealFaceId: null,
      correctionStrength: 1,
      currentFace: {
        detected: false,
        landmarkCount: 0,
        detectedAt: null,
        hasGeometry: false,
        hasPose: false,
        analyzed: false,
      },
      errors: [],
    });
  });

  it('moves to running with input attached and tolerates repeated start calls', async () => {
    const engine = createBeautyEngine();

    await engine.start(createInput());
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'running',
      lifecycleState: 'running',
      hasInput: true,
      inputAttached: true,
    });

    await engine.start(createInput());
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'running',
      lifecycleState: 'running',
      hasInput: true,
      inputAttached: true,
    });
  });

  it('moves back to idle on stop and tolerates repeated stop calls', async () => {
    const adapter = createAdapter(createDetection());
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    await engine.start(createInput());
    await engine.analyzeFrame({ video: createVideo(), timestamp: 1234 });
    await engine.stop();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'idle',
      lifecycleState: 'idle',
      currentFace: {
        detected: false,
        landmarkCount: 0,
        detectedAt: null,
        hasGeometry: false,
        hasPose: false,
        analyzed: false,
      },
    });

    await engine.stop();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'idle',
      lifecycleState: 'idle',
    });
  });

  it('moves to disposed safely and rejects start after dispose', async () => {
    const adapter = createAdapter(createDetection());
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    await engine.dispose();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'disposed',
      lifecycleState: 'disposed',
    });
    expect(adapter.disposeCalls).toBe(1);

    await engine.dispose();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'disposed',
      lifecycleState: 'disposed',
    });
    expect(adapter.disposeCalls).toBe(1);

    await expect(engine.start(createInput())).rejects.toThrow('BeautyEngine has already been disposed.');
  });

  it('reflects preset, ideal face, and clamped correction strength in the runtime snapshot', () => {
    const engine = createBeautyEngine();

    engine.setPreset(createPreset());
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      hasPreset: true,
      presetId: 'minimal_test_preset',
    });

    engine.setIdealFace(createIdealFace());
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      hasIdealFace: true,
      idealFaceId: 'minimal_test_ideal_face',
    });

    engine.setCorrectionStrength(0.45);
    expect(engine.getRuntimeSnapshot().correctionStrength).toBe(0.45);

    engine.setCorrectionStrength(-1);
    expect(engine.getRuntimeSnapshot().correctionStrength).toBe(0);

    engine.setCorrectionStrength(2);
    expect(engine.getRuntimeSnapshot().correctionStrength).toBe(1);
  });

  it('analyzes one frame with an injected adapter and updates the runtime snapshot', async () => {
    const adapter = createAdapter(createDetection());
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    const analysis = await engine.analyzeFrame({ video: createVideo(), timestamp: 1234 });

    expect(adapter.initializeCalls).toBe(1);
    expect(adapter.detectCalls).toBe(1);
    expect(analysis).not.toBeNull();
    expect(analysis?.analyzedAt).toBe(1234);
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      currentFace: {
        detected: true,
        landmarkCount: MIN_FACE_GEOMETRY_LANDMARK_COUNT,
        detectedAt: 1234,
        hasGeometry: true,
        hasPose: true,
        analyzed: true,
      },
    });
  });

  it('returns null and clears analysis when a face is not detected', async () => {
    const adapter = createAdapter(null);
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    await expect(engine.analyzeFrame({ video: createVideo(), timestamp: 1234 })).resolves.toBeNull();
    expect(engine.getRuntimeSnapshot().currentFace).toEqual({
      detected: false,
      landmarkCount: 0,
      detectedAt: null,
      hasGeometry: false,
      hasPose: false,
      analyzed: false,
    });
  });

  it('records an error when analyzeFrame is called without an adapter', async () => {
    const engine = createBeautyEngine();

    await expect(engine.analyzeFrame({ video: createVideo(), timestamp: 1234 })).rejects.toThrow(
      'BeautyEngine requires a faceLandmarkerAdapter to analyze frames.',
    );
    expect(engine.getRuntimeSnapshot().errors).toContain(
      'BeautyEngine requires a faceLandmarkerAdapter to analyze frames.',
    );
  });

  it('rejects analyzeFrame after dispose and records the error', async () => {
    const adapter = createAdapter(createDetection());
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    await engine.dispose();

    await expect(engine.analyzeFrame({ video: createVideo(), timestamp: 1234 })).rejects.toThrow(
      'BeautyEngine has already been disposed.',
    );
    expect(engine.getRuntimeSnapshot().errors).toContain('BeautyEngine has already been disposed.');
  });

  it('records analysis errors from insufficient landmarks', async () => {
    const adapter = createAdapter({
      landmarks: [{ x: 0.5, y: 0.5, z: 0 }],
    });
    const engine = createBeautyEngine({ faceLandmarkerAdapter: adapter });

    await expect(engine.analyzeFrame({ video: createVideo(), timestamp: 1234 })).rejects.toThrow(
      'CurrentFace does not include enough landmarks to create geometry.',
    );
    expect(engine.getRuntimeSnapshot().errors).toContain(
      'CurrentFace does not include enough landmarks to create geometry.',
    );
  });
});
