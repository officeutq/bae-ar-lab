import type { FaceLandmarkPoint } from '@engine/mediapipe/types';
import type { TemporalFilter } from './createTemporalFilter';

export function smoothLandmarks(
  landmarks: FaceLandmarkPoint[],
  filter: TemporalFilter,
  alpha: number,
): FaceLandmarkPoint[] {
  return landmarks.map((point, index) => ({
    x: filter.smooth(`landmarks.${index}.x`, point.x, alpha),
    y: filter.smooth(`landmarks.${index}.y`, point.y, alpha),
    z: filter.smooth(`landmarks.${index}.z`, point.z, alpha),
  }));
}
