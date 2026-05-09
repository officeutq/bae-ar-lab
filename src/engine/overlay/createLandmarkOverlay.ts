import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { createWarpVisualization } from './createWarpVisualization';

export type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
};

export type LandmarkOverlayToggles = {
  showLandmarks: boolean;
  showCenters: boolean;
  showWarpInfluence: boolean;
  showWarpCenter: boolean;
  showFalloffRings: boolean;
};

export type LandmarkOverlay = {
  syncSize: () => void;
  updateToggles: (toggles: Partial<LandmarkOverlayToggles>) => void;
  render: (landmarks: LandmarkPoint[] | null, geometry?: FaceGeometry | null, operation?: WarpOperation | null) => void;
  clear: () => void;
};

const LEFT_EYE_INDICES = [33, 133, 159, 145, 158, 153];
const RIGHT_EYE_INDICES = [362, 263, 386, 374, 385, 380];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const averagePoints = (points: LandmarkPoint[], indices: number[]) => {
  const valid = indices.map((index) => points[index]).filter(Boolean);

  if (valid.length === 0) {
    return null;
  }

  const sum = valid.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / valid.length,
    y: sum.y / valid.length,
  };
};

export function createLandmarkOverlay(canvas: HTMLCanvasElement): LandmarkOverlay {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D context is unavailable for overlay canvas.');
  }

  const toggles: LandmarkOverlayToggles = {
    showLandmarks: true,
    showCenters: true,
    showWarpInfluence: true,
    showWarpCenter: true,
    showFalloffRings: true,
  };
  const warpVisualization = createWarpVisualization(context);

  const syncSize = () => {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
  };

  const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawPoint = (x: number, y: number, radius: number, color: string) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  };

  const render = (landmarks: LandmarkPoint[] | null, geometry?: FaceGeometry | null, operation?: WarpOperation | null) => {
    syncSize();
    clear();

    if (!landmarks || landmarks.length === 0) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    if (toggles.showLandmarks) {
      for (const landmark of landmarks) {
        const x = clamp01(landmark.x) * width;
        const y = clamp01(landmark.y) * height;
        drawPoint(x, y, 1.5, '#55e0ff');
      }
    }

    if (toggles.showCenters) {
      const faceCenter = averagePoints(landmarks, landmarks.map((_, index) => index));
      const leftEyeCenter = averagePoints(landmarks, LEFT_EYE_INDICES);
      const rightEyeCenter = averagePoints(landmarks, RIGHT_EYE_INDICES);

      if (faceCenter) {
        drawPoint(clamp01(faceCenter.x) * width, clamp01(faceCenter.y) * height, 4, '#f7e45f');
      }

      if (leftEyeCenter) {
        drawPoint(clamp01(leftEyeCenter.x) * width, clamp01(leftEyeCenter.y) * height, 4, '#6ef8a8');
      }

      if (rightEyeCenter) {
        drawPoint(clamp01(rightEyeCenter.x) * width, clamp01(rightEyeCenter.y) * height, 4, '#ff8ed9');
      }
    }

    if (geometry && operation) {
      warpVisualization.draw(canvas, geometry, operation, {
        showWarpInfluence: toggles.showWarpInfluence,
        showWarpCenter: toggles.showWarpCenter,
        showFalloffRings: toggles.showFalloffRings,
      });
    }
  };

  const updateToggles = (nextToggles: Partial<LandmarkOverlayToggles>) => {
    if (typeof nextToggles.showLandmarks === 'boolean') {
      toggles.showLandmarks = nextToggles.showLandmarks;
    }

    if (typeof nextToggles.showCenters === 'boolean') {
      toggles.showCenters = nextToggles.showCenters;
    }

    if (typeof nextToggles.showWarpInfluence === 'boolean') {
      toggles.showWarpInfluence = nextToggles.showWarpInfluence;
    }

    if (typeof nextToggles.showWarpCenter === 'boolean') {
      toggles.showWarpCenter = nextToggles.showWarpCenter;
    }

    if (typeof nextToggles.showFalloffRings === 'boolean') {
      toggles.showFalloffRings = nextToggles.showFalloffRings;
    }
  };

  return {
    syncSize,
    updateToggles,
    render,
    clear,
  };
}
