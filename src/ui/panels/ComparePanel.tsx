import { Panel } from '@ui/Panel';

export type CompareCapture = {
  beforeDataUrl: string;
  afterDataUrl: string;
  capturedAt: string;
  presetName: string;
};

type Props = {
  capture: CompareCapture | null;
};

export function ComparePanel({ capture }: Props) {
  if (!capture) {
    return (
      <Panel title="Compare Panel">
        <p className="placeholder">Capture Compare を押すと before/after が表示されます。</p>
      </Panel>
    );
  }

  return (
    <Panel title="Compare Panel">
      <p className="camera-status">Preset: {capture.presetName || 'Untitled preset'}</p>
      <p className="camera-status">Captured at: {capture.capturedAt}</p>
      <div className="compare-grid">
        <div>
          <h4 className="compare-title">Before</h4>
          <img className="compare-image" src={capture.beforeDataUrl} alt="Before snapshot" />
        </div>
        <div>
          <h4 className="compare-title">After</h4>
          <img className="compare-image" src={capture.afterDataUrl} alt="After snapshot" />
        </div>
      </div>
    </Panel>
  );
}
