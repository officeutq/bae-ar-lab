import type { MutableRefObject } from 'react';
import { getRendererModeLabel, type RendererBackendMode, type RendererBackendState } from '@engine/render/types';
import type { BeautyDebugOverlayMode } from '@engine/overlay/beautyDebugOverlay';
import { Panel } from '@ui/Panel';

type Props = {
  canvas2dRef: MutableRefObject<HTMLCanvasElement | null>;
  webglCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  beautyDebugOverlayCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: RendererBackendState;
  rendererMode: RendererBackendMode;
  beautyDebugOverlayMode: BeautyDebugOverlayMode;
  onCaptureProcessed: () => void;
  previewAspectRatio: string;
};

export function ProcessedPreviewPanel({ canvas2dRef, webglCanvasRef, beautyDebugOverlayCanvasRef, rendererState, rendererMode, beautyDebugOverlayMode, onCaptureProcessed, previewAspectRatio }: Props) {
  return (
    <Panel title="加工プレビュー">
      <div className="source-preview preview-mirror" style={{ aspectRatio: previewAspectRatio }}>
        <canvas className="processed-canvas" ref={canvas2dRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'none' : 'block' }} />
        <canvas className="processed-canvas" ref={webglCanvasRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'block' : 'none' }} />
        <canvas className="overlay-canvas" ref={beautyDebugOverlayCanvasRef} style={{ display: beautyDebugOverlayMode === 'off' ? 'none' : 'block' }} />
      </div>
      <p className="camera-status">描画方式: {getRendererModeLabel(rendererMode)}</p>
      <p className="camera-status">描画状態: {rendererState}</p>
      <button type="button" onClick={onCaptureProcessed}>加工映像を撮影</button>
      <p className="capture-note">保存画像はプレビュー表示ではなく実データ（raw）基準です。</p>
    </Panel>
  );
}
