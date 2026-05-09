import type { MutableRefObject } from 'react';
import type { CanvasRendererState } from '@engine/render/createCanvasRenderer';
import { getRendererModeLabel, type RendererMode } from '@engine/render/types';
import { Panel } from '@ui/Panel';

type Props = {
  canvas2dRef: MutableRefObject<HTMLCanvasElement | null>;
  webglCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: CanvasRendererState;
  rendererMode: RendererMode;
  onCaptureProcessed: () => void;
  previewAspectRatio: string;
};

export function ProcessedPreviewPanel({ canvas2dRef, webglCanvasRef, rendererState, rendererMode, onCaptureProcessed, previewAspectRatio }: Props) {
  return (
    <Panel title="加工プレビュー">
      <canvas className="processed-canvas preview-mirror" ref={canvas2dRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'none' : 'block' }} />
      <canvas className="processed-canvas preview-mirror" ref={webglCanvasRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'block' : 'none' }} />
      <p className="camera-status">描画方式: {getRendererModeLabel(rendererMode)}</p>
      <p className="camera-status">描画状態: {rendererState}</p>
      <button type="button" onClick={onCaptureProcessed}>加工映像を撮影</button>
    </Panel>
  );
}
