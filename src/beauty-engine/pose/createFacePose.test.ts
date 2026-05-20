import { describe, expect, it } from 'vitest';

import type { CurrentFace } from '../face';
import type { CurrentFaceGeometry } from '../geometry';
import { createFacePose } from './createFacePose';

const createFace = (): CurrentFace => ({
  landmarks: [{ x: 0.5, y: 0.5, z: 0 }],
  landmarkCount: 1,
  detectedAt: 1234,
});

const createGeometry = (): CurrentFaceGeometry => ({
  center: { x: 0.5, y: 0.48 },
  width: 0.8,
  parts: {
    leftEye: { x: 0.35, y: 0.35 },
    rightEye: { x: 0.65, y: 0.38 },
    nose: { x: 0.54, y: 0.5 },
    mouth: { x: 0.5, y: 0.7 },
    chin: { x: 0.5, y: 0.92 },
  },
});

describe('createFacePose', () => {
  it('creates finite yaw, pitch, and roll values', () => {
    const pose = createFacePose(createFace(), createGeometry());

    expect(Number.isFinite(pose.yaw)).toBe(true);
    expect(Number.isFinite(pose.pitch)).toBe(true);
    expect(Number.isFinite(pose.roll)).toBe(true);
    expect(pose.yaw).toBeGreaterThanOrEqual(-90);
    expect(pose.yaw).toBeLessThanOrEqual(90);
    expect(pose.pitch).toBeGreaterThanOrEqual(-90);
    expect(pose.pitch).toBeLessThanOrEqual(90);
    expect(pose.roll).toBeGreaterThanOrEqual(-180);
    expect(pose.roll).toBeLessThanOrEqual(180);
  });

  it('throws when current face landmarks are missing', () => {
    expect(() =>
      createFacePose(
        {
          landmarks: [],
          landmarkCount: 0,
          detectedAt: 1234,
        },
        createGeometry(),
      ),
    ).toThrow('CurrentFace does not include enough landmarks to create pose.');
  });

  it('throws when geometry width is not usable', () => {
    expect(() =>
      createFacePose(createFace(), {
        ...createGeometry(),
        width: 0,
      }),
    ).toThrow('CurrentFaceGeometry width must be positive to create pose.');
  });
});
