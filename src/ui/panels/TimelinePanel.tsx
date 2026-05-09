import type { AnimationClip } from '@engine/animation/types';
import { useRef, type PointerEvent } from 'react';
import { Panel } from '@ui/Panel';

type Props = {
  clip: AnimationClip;
  currentTime: number;
  currentValues: Record<string, number>;
  onSeek: (time: number) => void;
  onScrubStart: () => void;
};

const TIMELINE_WIDTH = 100;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toTimelinePercent(time: number, duration: number) {
  if (duration <= 0) {
    return 0;
  }
  return clamp01(time / duration) * TIMELINE_WIDTH;
}

export function TimelinePanel({ clip, currentTime, currentValues, onSeek, onScrubStart }: Props) {
  const scrubRef = useRef(false);
  const playheadPercent = toTimelinePercent(currentTime, clip.duration);
  const timeFromClientX = (clientX: number, rect: DOMRect) => clamp01((clientX - rect.left) / Math.max(1, rect.width)) * clip.duration;
  const handleSeek = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(timeFromClientX(event.clientX, rect));
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    scrubRef.current = true;
    onScrubStart();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleSeek(event);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!scrubRef.current) return;
    handleSeek(event);
  };
  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    scrubRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <Panel title="Timeline Panel">
      <div className="timeline-panel">
        <div className="timeline-panel__header">
          <span>{clip.name}</span>
          <span>{currentTime.toFixed(2)}s / {clip.duration.toFixed(2)}s</span>
        </div>

        <div className="timeline-panel__tracks">
          {clip.tracks.map((track, trackIndex) => (
            <div className="timeline-track" key={`${track.track}-${trackIndex}`}>
              <div className="timeline-track__meta">
                <div className="timeline-track__path">{track.track}</div>
                <div className="timeline-track__stats">{track.keyframes.length} keyframes / value {Number(currentValues[track.track] ?? 0).toFixed(3)}</div>
              </div>

              <div
                className="timeline-track__bar"
                role="slider"
                aria-label={`timeline ${track.track}`}
                aria-valuemin={0}
                aria-valuemax={clip.duration}
                aria-valuenow={currentTime}
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
              >
                {track.keyframes.map((keyframe, keyframeIndex) => {
                  const left = toTimelinePercent(keyframe.time, clip.duration);
                  return (
                    <div
                      key={`${track.track}-${keyframe.time}-${keyframeIndex}`}
                      className="timeline-track__keyframe"
                      style={{ left: `${left}%` }}
                      title={`t=${keyframe.time.toFixed(2)}s / v=${keyframe.value.toFixed(3)}`}
                    />
                  );
                })}
                <div className="timeline-track__playhead" style={{ left: `${playheadPercent}%` }}>
                  <span className="timeline-track__playhead-label">{currentTime.toFixed(2)}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
