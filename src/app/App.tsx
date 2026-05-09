import { useMemo } from 'react';
import { defaultWarpPreset } from '@algorithms/defaultPreset';
import { createInitialPipelineState } from '@engine/pipeline';
import { Panel } from '@ui/Panel';

export function App() {
  const pipelineState = useMemo(() => createInitialPipelineState(defaultWarpPreset), []);

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">Beauty AR & Face Warp Lab</h1>
      <div className="panel-grid">
        <Panel title="Source Preview">
          <p className="placeholder">Source stream placeholder (camera not implemented).</p>
        </Panel>

        <Panel title="Processed Preview">
          <p className="placeholder">Processed output placeholder (rendering pipeline not implemented).</p>
        </Panel>

        <Panel title="Control Panel">
          <ul>
            <li>Status: {pipelineState.status}</li>
            <li>Preset: {pipelineState.activePreset.name}</li>
            <li>Intensity: {pipelineState.activePreset.params.intensity}</li>
            <li>Smoothness: {pipelineState.activePreset.params.smoothness}</li>
            <li>Falloff: {pipelineState.activePreset.params.falloff}</li>
          </ul>
        </Panel>

        <Panel title="JSON Output">
          <pre>{JSON.stringify(pipelineState.activePreset, null, 2)}</pre>
        </Panel>
      </div>
    </main>
  );
}
