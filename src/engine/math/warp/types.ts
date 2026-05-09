import type { WarpFalloffType } from '@app-types/preset';

export type Vec2 = {
  x: number;
  y: number;
};

export type RadialWarpInput = {
  uv: Vec2;
  center: Vec2;
  radius: number;
  strength: number;
  axis: Vec2;
  falloff: WarpFalloffType;
};

export type RadialWarpResult = {
  warpedUv: Vec2;
  influence: number;
};
