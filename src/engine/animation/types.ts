import type { WarpPreset } from '@app-types/preset';

export type AnimationTrackTarget =
  | 'beauty.intensity'
  | `operations.${number}.strength`
  | `operations.${number}.radius`
  | 'appearance.skinSmoothing.strength'
  | 'appearance.skinTone.brightness'
  | 'appearance.skinTone.saturation'
  | 'appearance.skinTone.warmth'
  | 'appearance.skinTone.blend';

export type AnimationKeyframe = {
  time: number;
  value: number;
};

export type AnimationTrack = {
  track: AnimationTrackTarget;
  keyframes: AnimationKeyframe[];
};

export type AnimationClip = {
  duration: number;
  tracks: AnimationTrack[];
};

export type ActiveAnimatedValues = Record<string, number>;

export type TimelinePlaybackState = 'stopped' | 'playing' | 'paused';

export type TimelineSnapshot = {
  currentTime: number;
  state: TimelinePlaybackState;
  loop: boolean;
  duration: number;
  activeTrackCount: number;
  values: ActiveAnimatedValues;
};

export type AnimationApplyResult = {
  preset: WarpPreset;
  beautyIntensity: number;
};
