import type { WarpFalloffType, WarpPreset, WarpTarget } from '@app-types/preset';
import { Panel } from '@ui/Panel';
import { FalloffGraph } from '@ui/components/FalloffGraph';

type Props = {
  activePreset: WarpPreset;
  pipelineStatus: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  cameraState: string;
  showLandmarks: boolean;
  setShowLandmarks: (value: boolean) => void;
  showCenters: boolean;
  setShowCenters: (value: boolean) => void;
  showWarpInfluence: boolean;
  setShowWarpInfluence: (value: boolean) => void;
  showWarpCenter: boolean;
  setShowWarpCenter: (value: boolean) => void;
  showFalloffRings: boolean;
  setShowFalloffRings: (value: boolean) => void;
  enableCpuWarpPreview: boolean;
  setEnableCpuWarpPreview: (value: boolean) => void;
  enableWebglRenderer: boolean;
  setEnableWebglRenderer: (value: boolean) => void;
  updateOperation: <K extends keyof WarpPreset['operations'][number]>(key: K, value: WarpPreset['operations'][number][K]) => void;
  updateAxis: (axisKey: 'x' | 'y', value: number) => void;
  updateFalloffType: (type: WarpFalloffType) => void;
};

export function ControlPanel(props: Props) {
  const op = props.activePreset.operations[0];

  return (
    <Panel title="Control Panel">
      <div className="camera-controls">
        <button type="button" onClick={props.onStartCamera} disabled={props.cameraState === 'starting'}>Start Camera</button>
        <button type="button" onClick={props.onStopCamera} disabled={props.cameraState !== 'running'}>Stop Camera</button>
      </div>
      <div className="overlay-controls">
        <label><input type="checkbox" checked={props.showLandmarks} onChange={(e) => props.setShowLandmarks(e.target.checked)} />Show landmarks</label>
        <label><input type="checkbox" checked={props.showCenters} onChange={(e) => props.setShowCenters(e.target.checked)} />Show centers</label>
        <label><input type="checkbox" checked={props.showWarpInfluence} onChange={(e) => props.setShowWarpInfluence(e.target.checked)} />Show warp influence</label>
        <label><input type="checkbox" checked={props.showWarpCenter} onChange={(e) => props.setShowWarpCenter(e.target.checked)} />Show warp center</label>
        <label><input type="checkbox" checked={props.showFalloffRings} onChange={(e) => props.setShowFalloffRings(e.target.checked)} />Show falloff rings</label>
        <label><input type="checkbox" checked={props.enableCpuWarpPreview} onChange={(e) => props.setEnableCpuWarpPreview(e.target.checked)} />Enable CPU warp preview</label>
        <label><input type="checkbox" checked={props.enableWebglRenderer} onChange={(e) => props.setEnableWebglRenderer(e.target.checked)} />Enable WebGL renderer</label>
      </div>
      <div className="operation-controls">
        <label><input type="checkbox" checked={op?.enabled ?? false} onChange={(e) => props.updateOperation('enabled', e.target.checked)} />Operation enabled</label>
        <label>Target
          <select value={op?.target ?? 'left_eye'} onChange={(e) => props.updateOperation('target', e.target.value as WarpTarget)}>
            <option value="left_eye">left_eye</option><option value="right_eye">right_eye</option><option value="face_center">face_center</option><option value="mouth">mouth</option><option value="nose">nose</option>
          </select>
        </label>
        <label>Strength: {(op?.strength ?? 0).toFixed(2)}
          <input type="range" min={-0.2} max={0.2} step={0.01} value={op?.strength ?? 0} onChange={(e) => props.updateOperation('strength', Number(e.target.value))} />
        </label>
        <label>Radius: {(op?.radius ?? 0).toFixed(2)}
          <input type="range" min={0.1} max={5} step={0.1} value={op?.radius ?? 1} onChange={(e) => props.updateOperation('radius', Number(e.target.value))} />
        </label>
        <label>Falloff
          <select value={op?.falloff.type ?? 'smoothstep'} onChange={(e) => props.updateFalloffType(e.target.value as WarpFalloffType)}>
            <option value="linear">linear</option><option value="smoothstep">smoothstep</option><option value="gaussian">gaussian</option>
          </select>
        </label>
        <FalloffGraph type={op?.falloff.type ?? 'smoothstep'} sampleCount={64} />
        <label>Axis X: {(op?.axis.x ?? 0).toFixed(2)}
          <input type="range" min={0} max={2} step={0.05} value={op?.axis.x ?? 1} onChange={(e) => props.updateAxis('x', Number(e.target.value))} />
        </label>
        <label>Axis Y: {(op?.axis.y ?? 0).toFixed(2)}
          <input type="range" min={0} max={2} step={0.05} value={op?.axis.y ?? 1} onChange={(e) => props.updateAxis('y', Number(e.target.value))} />
        </label>
      </div>
      <ul>
        <li>Status: {props.pipelineStatus}</li>
        <li>Preset version: {props.activePreset.version}</li>
        <li>Operation id: {op?.id}</li>
        <li>Operation type: {op?.type}</li>
      </ul>
    </Panel>
  );
}
