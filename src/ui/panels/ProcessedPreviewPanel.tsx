import type { MutableRefObject } from 'react';
import type { CanvasRendererState } from '@engine/render/createCanvasRenderer';
import { Panel } from '@ui/Panel';

type Props = {
  processedCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: CanvasRendererState;
};

export function ProcessedPreviewPanel({ processedCanvasRef, rendererState }: Props) {
  return (
    <Panel title="Processed Preview">
      <canvas className="processed-canvas" ref={processedCanvasRef} />
      <p className="camera-status">Renderer state: {rendererState}</p>
    </Panel>
  );
}
