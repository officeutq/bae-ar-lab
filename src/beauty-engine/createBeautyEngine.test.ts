import { describe, expect, it } from 'vitest';
import { createBeautyEngine } from './createBeautyEngine';
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
      },
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
    const engine = createBeautyEngine();

    await engine.start(createInput());
    await engine.stop();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'idle',
      lifecycleState: 'idle',
    });

    await engine.stop();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'idle',
      lifecycleState: 'idle',
    });
  });

  it('moves to disposed safely and rejects start after dispose', async () => {
    const engine = createBeautyEngine();

    await engine.dispose();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'disposed',
      lifecycleState: 'disposed',
    });

    await engine.dispose();
    expect(engine.getRuntimeSnapshot()).toMatchObject({
      state: 'disposed',
      lifecycleState: 'disposed',
    });

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
});
