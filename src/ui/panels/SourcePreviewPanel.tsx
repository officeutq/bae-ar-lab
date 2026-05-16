import type { MutableRefObject } from 'react';
import type { FaceLandmarkerRuntimeState } from '@engine/mediapipe/types';
import { Panel } from '@ui/Panel';

type Props = {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  overlayCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  cameraState: string;
  landmarkerState: FaceLandmarkerRuntimeState;
  cameraErrorMessage: string | null;
  onCaptureSource: () => void;
  previewAspectRatio: string;
};

export function SourcePreviewPanel({ videoRef, overlayCanvasRef, cameraState, landmarkerState, cameraErrorMessage, onCaptureSource, previewAspectRatio }: Props) {
  return (
    <Panel
      title="入力プレビュー"
      headerExtras={(
        <div className="preview-header-meta">
          <span>camera: {cameraState}</span>
          <span>landmarker: {landmarkerState}</span>
          <button type="button" onClick={onCaptureSource}>元映像を撮影</button>
        </div>
      )}
    >
      <div className="source-preview preview-mirror" data-preview-role="source" style={{ aspectRatio: previewAspectRatio }}>
        <video className="source-video" data-preview-role="source-video" ref={videoRef} autoPlay playsInline muted />
        <canvas className="overlay-canvas" data-preview-role="source-overlay" ref={overlayCanvasRef} />
      </div>
      {cameraErrorMessage ? <p className="camera-error">{cameraErrorMessage}</p> : null}
    </Panel>
  );
}
