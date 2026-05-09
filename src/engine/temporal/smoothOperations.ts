import type { WarpOperation } from '@app-types/preset';
import type { TemporalFilter } from './createTemporalFilter';

const smoothPoint = (filter: TemporalFilter, key: string, point: { x: number; y: number }, alpha: number) => ({
  x: filter.smooth(`${key}.x`, point.x, alpha),
  y: filter.smooth(`${key}.y`, point.y, alpha),
});

export function smoothOperations(operations: WarpOperation[], filter: TemporalFilter, alpha: number): WarpOperation[] {
  return operations.map((operation, index) => {
    const base = `operations.${index}`;
    return {
      ...operation,
      lineStart: smoothPoint(filter, `${base}.lineStart`, operation.lineStart, alpha),
      lineEnd: smoothPoint(filter, `${base}.lineEnd`, operation.lineEnd, alpha),
      polygon: operation.polygon.map((point, pointIndex) => smoothPoint(filter, `${base}.polygon.${pointIndex}`, point, alpha)),
      weightMap: operation.weightMap
        ? {
          ...operation.weightMap,
          center: smoothPoint(filter, `${base}.weightMap.center`, operation.weightMap.center, alpha),
        }
        : undefined,
    };
  });
}
