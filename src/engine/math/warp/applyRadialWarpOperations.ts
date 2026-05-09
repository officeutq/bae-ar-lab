import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { getWarpTargetGeometry } from '@engine/render/getWarpTargetGeometry';
import { applyRadialWarp } from './applyRadialWarp';
import type { Vec2 } from './types';

const FALLBACK_SIZE = 0.05;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function getEnabledRadialWarpOperations(operations: WarpOperation[]): WarpOperation[] {
  return operations.filter((operation) => operation.enabled && operation.type === 'radial_warp');
}

export function applyRadialWarpOperations(
  uv: Vec2,
  operations: WarpOperation[],
  geometry: FaceGeometry,
): Vec2 {
  const enabledOperations = getEnabledRadialWarpOperations(operations);

  return enabledOperations.reduce<Vec2>((currentUv, operation) => {
    const target = getWarpTargetGeometry(operation.target, geometry);
    const warpCenter = { x: clamp01(target.center.x), y: clamp01(target.center.y) };
    const warpRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;

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
