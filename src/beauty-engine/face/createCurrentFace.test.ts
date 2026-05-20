import { describe, expect, it } from 'vitest';

import { createCurrentFace } from './createCurrentFace';

describe('createCurrentFace', () => {
  it('converts a face detection result into a current face', () => {
    const currentFace = createCurrentFace(
      {
        landmarks: [
          { x: 0.1, y: 0.2, z: -0.3 },
          { x: 0.4, y: 0.5, z: -0.6 },
        ],
      },
      1234,
    );

    expect(currentFace).toEqual({
      landmarks: [
        { x: 0.1, y: 0.2, z: -0.3 },
        { x: 0.4, y: 0.5, z: -0.6 },
      ],
      landmarkCount: 2,
      detectedAt: 1234,
    });
  });

  it('throws when landmarks are empty', () => {
    expect(() =>
      createCurrentFace(
        {
          landmarks: [],
        },
        1234,
      ),
    ).toThrow('Cannot create CurrentFace from an empty landmark set.');
  });
});
