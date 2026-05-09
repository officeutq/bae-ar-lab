import type { MutableRefObject } from 'react';
import type { CanvasRendererState } from '@engine/render/createCanvasRenderer';
import { getRendererModeLabel, type RendererMode } from '@engine/render/types';
import { Panel } from '@ui/Panel';

type Props = {
  processedCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: CanvasRendererState;
  rendererMode: RendererMode;
};

export function ProcessedPreviewPanel({ processedCanvasRef, rendererState, rendererMode }: Props) {
  return (
    <Panel title="Processed Preview">
      <canvas className="processed-canvas" ref={processedCanvasRef} />
      <p className="camera-status">Renderer backend: {getRendererModeLabel(rendererMode)}</p>
      <p className="camera-status">Renderer state: {rendererState}</p>
    </Panel>
  );
}
