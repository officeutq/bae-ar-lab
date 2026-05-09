import type { AnimationClip, TimelinePlaybackState, TimelineSnapshot } from './types';
import { interpolateKeyframes } from './interpolateKeyframes';

export function createTimeline(clip: AnimationClip) {
  let currentTime = 0;
  let state: TimelinePlaybackState = 'stopped';
  let loop = false;

  const evaluate = (): TimelineSnapshot => {
    const values = clip.tracks.reduce<Record<string, number>>((acc, track) => {
      acc[track.track] = interpolateKeyframes(track.keyframes, currentTime);
      return acc;
    }, {});

    return {
      currentTime,
      state,
      loop,
      duration: clip.duration,
      activeTrackCount: clip.tracks.length,
      values,
    };
  };

  return {
    play() { state = 'playing'; },
    pause() { if (state === 'playing') state = 'paused'; },
    setPlaying(value: boolean) { state = value ? 'playing' : (state === 'stopped' ? 'stopped' : 'paused'); },
    stop() { state = 'stopped'; currentTime = 0; },
    setLoop(value: boolean) { loop = value; },
    seek(time: number) { currentTime = Math.max(0, Math.min(clip.duration, time)); },
    setTime(time: number) { currentTime = Math.max(0, Math.min(clip.duration, time)); },
    update(deltaSeconds: number) {
      if (state !== 'playing') return evaluate();
      currentTime += Math.max(0, deltaSeconds);
      if (currentTime > clip.duration) {
        if (loop && clip.duration > 0) currentTime %= clip.duration;
        else { currentTime = clip.duration; state = 'paused'; }
      }
      return evaluate();
    },
    getSnapshot: evaluate,
  };
}
