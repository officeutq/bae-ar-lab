import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { getWarpTargetGeometry } from '@engine/render/getWarpTargetGeometry';
import { applyDirectionalWarp } from './applyDirectionalWarp';
import { applyLineWarp } from './applyLineWarp';
import { applyRadialWarp } from './applyRadialWarp';
import type { Vec2 } from './types';

const FALLBACK_SIZE = 0.05;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function getEnabledWarpOperations(operations: WarpOperation[]): WarpOperation[] {
  return operations.filter((operation) => operation.enabled);
}

export function applyWarpOperations(uv: Vec2, operations: WarpOperation[], geometry: FaceGeometry): Vec2 {
  const enabledOperations = getEnabledWarpOperations(operations);

  return enabledOperations.reduce<Vec2>((currentUv, operation) => {
    const target = getWarpTargetGeometry(operation.target, geometry);
    const warpCenter = { x: clamp01(target.center.x), y: clamp01(target.center.y) };
    const warpRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;

    if (operation.type === 'line_warp') {
      return applyLineWarp({
        uv: currentUv,
        lineStart: operation.lineStart,
        lineEnd: operation.lineEnd,
        width: operation.width,
        strength: operation.strength,
        direction: operation.direction,
        falloff: operation.falloff.type,
      }).warpedUv;
    }

    if (operation.type === 'directional_warp') {
      return applyDirectionalWarp({
        uv: currentUv,
        center: warpCenter,
        radius: warpRadius,
        strength: operation.strength,
        axis: operation.axis,
        direction: operation.direction,
        falloff: operation.falloff.type,
      }).warpedUv;
    }

    return applyRadialWarp({
      uv: currentUv,
      center: warpCenter,
      radius: warpRadius,
      strength: operation.strength,
      axis: operation.axis,
      falloff: operation.falloff.type,
    }).warpedUv;
  }, uv);
}
