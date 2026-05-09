import type { MutableRefObject } from 'react';
import type { CanvasRendererState } from '@engine/render/createCanvasRenderer';
import { getRendererModeLabel, type RendererMode } from '@engine/render/types';
import { Panel } from '@ui/Panel';

type Props = {
  processedCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: CanvasRendererState;
  rendererMode: RendererMode;
  onCaptureProcessed: () => void;
};

export function ProcessedPreviewPanel({ processedCanvasRef, rendererState, rendererMode, onCaptureProcessed }: Props) {
  return (
    <Panel title="Processed Preview">
      <canvas className="processed-canvas" ref={processedCanvasRef} />
      <p className="camera-status">Renderer backend: {getRendererModeLabel(rendererMode)}</p>
      <p className="camera-status">Renderer state: {rendererState}</p>
      <button type="button" onClick={onCaptureProcessed}>Capture Processed</button>
    </Panel>
  );
}
