import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry, Point2D } from '@engine/geometry/types';

function getLinePoint(name: NonNullable<WarpOperation['binding']>['start'], geometry: FaceGeometry): Point2D | null {
  switch (name) {
    case 'left_cheek':
      return geometry.leftJawLine.start;
    case 'right_cheek':
      return geometry.rightJawLine.start;
    case 'chin':
      return geometry.leftJawLine.end;
    case 'chin_left':
      return geometry.chinLine.start;
    case 'chin_right':
      return geometry.chinLine.end;
    default:
      return null;
  }
}

export function resolveOperationBindings(operations: WarpOperation[], geometry: FaceGeometry | null): WarpOperation[] {
  if (!geometry) return operations;

  return operations.map((operation) => {
    if (!operation.binding || operation.binding.type !== 'landmark_line') {
      return operation;
    }

    const start = getLinePoint(operation.binding.start, geometry);
    const end = getLinePoint(operation.binding.end, geometry);

    if (!start || !end) {
      return operation;
    }

    return {
      ...operation,
      lineStart: start,
      lineEnd: end,
    };
  });
}
