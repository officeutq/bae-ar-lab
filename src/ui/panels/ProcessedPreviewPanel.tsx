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
};

export function ProcessedPreviewPanel({ canvas2dRef, webglCanvasRef, rendererState, rendererMode, onCaptureProcessed }: Props) {
  return (
    <Panel title="Processed Preview">
      <canvas className="processed-canvas" ref={canvas2dRef} style={{ display: rendererMode === 'webgl' ? 'none' : 'block' }} />
      <canvas className="processed-canvas" ref={webglCanvasRef} style={{ display: rendererMode === 'webgl' ? 'block' : 'none' }} />
      <p className="camera-status">Renderer backend: {getRendererModeLabel(rendererMode)}</p>
      <p className="camera-status">Renderer state: {rendererState}</p>
      <button type="button" onClick={onCaptureProcessed}>Capture Processed</button>
    </Panel>
  );
}
