import type { MutableRefObject } from 'react';
import type { FaceLandmarkerRuntimeState } from '@engine/mediapipe/types';
import { Panel } from '@ui/Panel';

type Props = {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  overlayCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  cameraState: string;
  landmarkerState: FaceLandmarkerRuntimeState;
  cameraErrorMessage: string | null;
};

export function SourcePreviewPanel({ videoRef, overlayCanvasRef, cameraState, landmarkerState, cameraErrorMessage }: Props) {
  return (
    <Panel title="Source Preview">
      <div className="source-preview">
        <video className="source-video" ref={videoRef} autoPlay playsInline muted />
        <canvas className="overlay-canvas" ref={overlayCanvasRef} />
      </div>
      <p className="camera-status">Camera state: {cameraState}</p>
      <p className="camera-status">Landmarker state: {landmarkerState}</p>
      {cameraErrorMessage ? <p className="camera-error">{cameraErrorMessage}</p> : null}
    </Panel>
  );
}
