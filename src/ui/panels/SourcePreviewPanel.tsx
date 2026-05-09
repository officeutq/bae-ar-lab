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
    <Panel title="入力プレビュー">
      <div className="source-preview preview-mirror" style={{ aspectRatio: previewAspectRatio }}>
        <video className="source-video" ref={videoRef} autoPlay playsInline muted />
        <canvas className="overlay-canvas" ref={overlayCanvasRef} />
      </div>
      <p className="camera-status">カメラ状態: {cameraState}</p>
      <p className="camera-status">ランドマーカー状態: {landmarkerState}</p>
      {cameraErrorMessage ? <p className="camera-error">{cameraErrorMessage}</p> : null}
      <button type="button" onClick={onCaptureSource}>元映像を撮影</button>
    </Panel>
  );
}
