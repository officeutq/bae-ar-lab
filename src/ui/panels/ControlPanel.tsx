import type { WarpFalloffType, WarpOperationType, WarpPreset, WarpTarget, WarpWeightMapType } from '@app-types/preset';
import type { StoredPreset } from '@engine/presets/types';
import type { RendererMode } from '@engine/render/types';
import type { SamplePresetId } from '@algorithms/presets';
import type { QualityLevel } from '@engine/performance/adaptiveQuality';
import type { DeviceCapabilities } from '@engine/performance/detectDeviceCapabilities';
import { Panel } from '@ui/Panel';
import { FalloffGraph } from '@ui/components/FalloffGraph';

type Props = {
  activePreset: WarpPreset;
  beautyIntensity: number;
  setBeautyIntensity: (value: number) => void;
  animationPlaying: boolean;
  animationTime: number;
  animationLoop: boolean;
  animationTrackCount: number;
  onPlayAnimation: () => void;
  onPauseAnimation: () => void;
  onStopAnimation: () => void;
  onTimelineTimeChange: (value: number) => void;
  setAnimationLoop: (value: boolean) => void;
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
  rendererMode: RendererMode;
  setRendererMode: (value: RendererMode) => void;
  activeOperationIndex: number;
  setActiveOperationIndex: (value: number) => void;
  addOperation: () => void;
  removeOperation: () => void;
  updateOperation: <K extends keyof WarpPreset['operations'][number]>(key: K, value: WarpPreset['operations'][number][K]) => void;
  updateAxis: (axisKey: 'x' | 'y', value: number) => void;
  updateFalloffType: (type: WarpFalloffType) => void;
  updateDirection: (directionKey: 'x' | 'y', value: number) => void;
  presetNameInput: string;
  setPresetNameInput: (name: string) => void;
  presets: StoredPreset[];
  activeStoredPresetId: string | null;
  onSavePreset: () => void;
  onCreatePreset: () => void;
  onDeletePreset: () => void;
  onRenamePreset: () => void;
  onLoadPreset: (id: string) => void;
  selectedSamplePresetId: SamplePresetId | '';
  onSelectSamplePreset: (id: SamplePresetId) => void;
  onExportPreset: () => void;
  onImportPresetText: (text: string) => void;
  onCaptureCompare: () => void;
  presetMessage: string | null;
  resolvedActiveOperation: WarpPreset['operations'][number] | null;
  skinSmoothing: { enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean };
  updateSkinSmoothing: (patch: Partial<{ enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean }>) => void;
  skinTone: { enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number };
  updateSkinTone: (patch: Partial<{ enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number }>) => void;
  adaptiveQualityEnabled: boolean;
  onAdaptiveQualityEnabledChange: (value: boolean) => void;
  selectedQuality: QualityLevel;
  currentQuality: QualityLevel;
  onSelectedQualityChange: (value: QualityLevel) => void;
  capabilities: DeviceCapabilities;
};

export function ControlPanel(props: Props) {
  const op = props.activePreset.operations[props.activeOperationIndex];

  return (
    <Panel title="Control Panel">
      <div className="operation-controls">
        <label>Preset name
          <input type="text" value={props.presetNameInput} onChange={(e) => props.setPresetNameInput(e.target.value)} />
        </label>
        <label>Sample presets
          <select
            value={props.selectedSamplePresetId}
            onChange={(e) => {
              const next = e.target.value as SamplePresetId;
              if (next) {
                props.onSelectSamplePreset(next);
              }
            }}
          >
            <option value="">-- Select sample preset --</option>
            <option value="natural">Natural</option>
            <option value="soft_beauty">Soft Beauty</option>
            <option value="strong_beauty">Strong Beauty</option>
            <option value="face_slim">Face Slim</option>
            <option value="skin_tone">Skin Tone</option>
          </select>
        </label>

        <label>Beauty Intensity: {Math.round(props.beautyIntensity * 100)}%
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={props.beautyIntensity}
            onChange={(e) => props.setBeautyIntensity(Number(e.target.value))}
          />
        </label>
        <label>Saved presets
          <select value={props.activeStoredPresetId ?? ''} onChange={(e) => props.onLoadPreset(e.target.value)}>
            <option value="">-- Select preset --</option>
            {props.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
        </label>
        <div className="camera-controls">
          <button type="button" onClick={props.onCaptureCompare}>Capture Compare</button>
          <button type="button" onClick={props.onSavePreset}>Save current preset</button>
          <button type="button" onClick={props.onCreatePreset}>Create new preset</button>
          <button type="button" onClick={props.onRenamePreset} disabled={!props.activeStoredPresetId}>Rename preset</button>
          <button type="button" onClick={props.onDeletePreset} disabled={!props.activeStoredPresetId}>Delete preset</button>
          <button type="button" onClick={props.onExportPreset}>Export JSON</button>
        </div>
        <label>Import preset JSON (auto import on blur)
          <textarea rows={6} placeholder="Paste preset JSON" onBlur={(e) => props.onImportPresetText(e.target.value)} />
        </label>
        {props.presetMessage && <p className="camera-status">{props.presetMessage}</p>}
      </div>

      <div className="operation-controls">
        <p className="camera-status">Animation time: {props.animationTime.toFixed(2)}s</p>
        <p className="camera-status">Active track count: {props.animationTrackCount}</p>
        <div className="camera-controls">
          <button type="button" onClick={props.onPlayAnimation}>Play animation</button>
          <button type="button" onClick={props.onPauseAnimation} disabled={!props.animationPlaying}>Pause animation</button>
          <button type="button" onClick={props.onStopAnimation}>Stop animation</button>
        </div>
        <label><input type="checkbox" checked={props.animationLoop} onChange={(e) => props.setAnimationLoop(e.target.checked)} />Loop animation</label>
        <label>Timeline time: {props.animationTime.toFixed(2)}s
          <input type="range" min={0} max={3} step={0.01} value={props.animationTime} onChange={(e) => props.onTimelineTimeChange(Number(e.target.value))} />
        </label>
      </div>

      <div className="camera-controls">
        <button type="button" onClick={props.onStartCamera} disabled={props.cameraState === 'starting'}>Start Camera</button>
        <button type="button" onClick={props.onStopCamera} disabled={props.cameraState !== 'running'}>Stop Camera</button>
      </div>
      <div className="overlay-controls">
        <label><input type="checkbox" checked={props.adaptiveQualityEnabled} onChange={(e) => props.onAdaptiveQualityEnabledChange(e.target.checked)} />Adaptive quality</label>
        <label>Manual quality
          <select value={props.selectedQuality} onChange={(e) => props.onSelectedQualityChange(e.target.value as QualityLevel)}>
            <option value="ultra">ultra</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
          </select>
        </label>
        <p className="camera-status">Current quality: {props.currentQuality}</p>
        <p className="camera-status">Device: {props.capabilities.deviceType} / WebGL2: {props.capabilities.webgl2Available ? 'yes' : 'no'}</p>
        <p className="camera-status">Recommended: {props.capabilities.recommendedRendererMode}, {props.capabilities.recommendedQuality} (max ops {props.capabilities.maxRecommendedOperationCount})</p>
        <p className="camera-status">Memory/Cores: {props.capabilities.deviceMemoryGb ?? 'n/a'} GB / {props.capabilities.hardwareConcurrency ?? 'n/a'}</p>
        <label><input type="checkbox" checked={props.showLandmarks} onChange={(e) => props.setShowLandmarks(e.target.checked)} />Show landmarks</label>
        <label><input type="checkbox" checked={props.showCenters} onChange={(e) => props.setShowCenters(e.target.checked)} />Show centers</label>
        <label><input type="checkbox" checked={props.showWarpInfluence} onChange={(e) => props.setShowWarpInfluence(e.target.checked)} />Show warp influence</label>
        <label><input type="checkbox" checked={props.showWarpCenter} onChange={(e) => props.setShowWarpCenter(e.target.checked)} />Show warp center</label>
        <label><input type="checkbox" checked={props.showFalloffRings} onChange={(e) => props.setShowFalloffRings(e.target.checked)} />Show falloff rings</label>
        <label>Renderer Backend
          <select value={props.rendererMode} onChange={(e) => props.setRendererMode(e.target.value as RendererMode)}>
            <option value="canvas2d">Canvas 2D</option>
            <option value="cpu_warp_debug">CPU Warp Debug</option>
            <option value="webgl" disabled={!props.capabilities.webgl2Available}>WebGL</option>
          </select>
        </label>
      </div>
      <div className="operation-list-controls">
        <label>Active operation
          <select value={props.activeOperationIndex} onChange={(e) => props.setActiveOperationIndex(Number(e.target.value))}>
            {props.activePreset.operations.map((operation, index) => (
              <option key={operation.id} value={index}>{index}: {operation.id}</option>
            ))}
          </select>
        </label>
        <div className="camera-controls">
          <button type="button" onClick={props.addOperation}>Add operation</button>
          <button type="button" onClick={props.removeOperation} disabled={props.activePreset.operations.length <= 1}>Remove operation</button>
        </div>
      </div>
      <div className="operation-controls">
        <label>Operation id
          <input type="text" value={op?.id ?? ''} onChange={(e) => props.updateOperation('id', e.target.value)} />
        </label>
        <label><input type="checkbox" checked={op?.enabled ?? false} onChange={(e) => props.updateOperation('enabled', e.target.checked)} />Operation enabled</label>
        <label>Operation type
          <select value={op?.type ?? 'radial_warp'} onChange={(e) => props.updateOperation('type', e.target.value as WarpOperationType)}>
            <option value="radial_warp">radial_warp</option><option value="directional_warp">directional_warp</option><option value="line_warp">line_warp</option><option value="region_warp">region_warp</option>
          </select>
        </label>
        <label>Target
          <select value={op?.target ?? 'left_eye'} onChange={(e) => props.updateOperation('target', e.target.value as WarpTarget)}>
            <option value="left_eye">left_eye</option><option value="right_eye">right_eye</option><option value="face_center">face_center</option><option value="mouth">mouth</option><option value="nose">nose</option><option value="left_jaw">left_jaw</option><option value="right_jaw">right_jaw</option><option value="chin_line">chin_line</option><option value="left_cheek">left_cheek</option><option value="right_cheek">right_cheek</option><option value="jaw_region">jaw_region</option>
          </select>
        </label>
        <label>Strength: {(op?.strength ?? 0).toFixed(2)}
          <input type="range" min={-0.2} max={0.2} step={0.01} value={op?.strength ?? 0} onChange={(e) => props.updateOperation('strength', Number(e.target.value))} />
        </label>
        <label>Radius: {(op?.radius ?? 0).toFixed(2)}
          <input type="range" min={0.1} max={5} step={0.1} value={op?.radius ?? 1} onChange={(e) => props.updateOperation('radius', Number(e.target.value))} />
        </label>
        {op?.type === 'line_warp' && (
          <>
            <label>Binding target (read-only)
              <input type="text" value={op?.binding?.type === 'landmark_line' ? `${op.binding.type}: ${op.binding.start} -> ${op.binding.end}` : 'none'} readOnly />
            </label>
            <label>Resolved Start (read-only)
              <input type="text" value={props.resolvedActiveOperation ? `${props.resolvedActiveOperation.lineStart.x.toFixed(3)}, ${props.resolvedActiveOperation.lineStart.y.toFixed(3)}` : 'n/a'} readOnly />
            </label>
            <label>Resolved End (read-only)
              <input type="text" value={props.resolvedActiveOperation ? `${props.resolvedActiveOperation.lineEnd.x.toFixed(3)}, ${props.resolvedActiveOperation.lineEnd.y.toFixed(3)}` : 'n/a'} readOnly />
            </label>
            <label>Line Start X: {(op?.lineStart.x ?? 0).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.lineStart.x ?? 0.3} onChange={(e) => props.updateOperation('lineStart', { ...(op?.lineStart ?? { x: 0.3, y: 0.5 }), x: Number(e.target.value) })} />
            </label>
            <label>Line Start Y: {(op?.lineStart.y ?? 0).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.lineStart.y ?? 0.5} onChange={(e) => props.updateOperation('lineStart', { ...(op?.lineStart ?? { x: 0.3, y: 0.5 }), y: Number(e.target.value) })} />
            </label>
            <label>Line End X: {(op?.lineEnd.x ?? 0).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.lineEnd.x ?? 0.7} onChange={(e) => props.updateOperation('lineEnd', { ...(op?.lineEnd ?? { x: 0.7, y: 0.5 }), x: Number(e.target.value) })} />
            </label>
            <label>Line End Y: {(op?.lineEnd.y ?? 0).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.lineEnd.y ?? 0.5} onChange={(e) => props.updateOperation('lineEnd', { ...(op?.lineEnd ?? { x: 0.7, y: 0.5 }), y: Number(e.target.value) })} />
            </label>
            <label>Width: {(op?.width ?? 0).toFixed(2)}
              <input type="range" min={0.01} max={1} step={0.01} value={op?.width ?? 0.12} onChange={(e) => props.updateOperation('width', Number(e.target.value))} />
            </label>
          </>
        )}
        {op?.type === 'region_warp' && (
          <>
            <label>Binding type (read-only)
              <input type="text" value={op?.binding?.type ?? 'none'} readOnly />
            </label>
            <label>Region target (read-only)
              <input type="text" value={op?.binding?.type === 'landmark_region' ? op.binding.region : 'none'} readOnly />
            </label>
            <label>Resolved polygon point count (read-only)
              <input type="text" value={String(props.resolvedActiveOperation?.polygon.length ?? 0)} readOnly />
            </label>
            <label>Polygon points (x,y per line)
              <textarea
                rows={6}
                value={(op?.polygon ?? []).map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join('\n')}
                onChange={(e) => {
                  const nextPolygon = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
                    const [x, y] = line.split(',').map((value) => Number(value.trim()));
                    return { x, y };
                  }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
                  props.updateOperation('polygon', nextPolygon);
                }}
              />
            </label>
            <label>Weight type
              <select value={op?.weightMap?.type ?? 'uniform'} onChange={(e) => props.updateOperation('weightMap', { ...(op?.weightMap ?? { center: { x: 0.5, y: 0.5 }, radius: 0.5 }), type: e.target.value as WarpWeightMapType })}>
                <option value="uniform">uniform</option><option value="radial_gradient">radial_gradient</option>
              </select>
            </label>
            <label>Gradient Center X: {(op?.weightMap?.center.x ?? 0.5).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.weightMap?.center.x ?? 0.5} onChange={(e) => props.updateOperation('weightMap', { ...(op?.weightMap ?? { type: 'uniform', center: { x: 0.5, y: 0.5 }, radius: 0.5 }), center: { ...(op?.weightMap?.center ?? { x: 0.5, y: 0.5 }), x: Number(e.target.value) } })} />
            </label>
            <label>Gradient Center Y: {(op?.weightMap?.center.y ?? 0.5).toFixed(2)}
              <input type="range" min={0} max={1} step={0.01} value={op?.weightMap?.center.y ?? 0.5} onChange={(e) => props.updateOperation('weightMap', { ...(op?.weightMap ?? { type: 'uniform', center: { x: 0.5, y: 0.5 }, radius: 0.5 }), center: { ...(op?.weightMap?.center ?? { x: 0.5, y: 0.5 }), y: Number(e.target.value) } })} />
            </label>
            <label>Gradient Radius: {(op?.weightMap?.radius ?? 0.5).toFixed(2)}
              <input type="range" min={0.01} max={1} step={0.01} value={op?.weightMap?.radius ?? 0.5} onChange={(e) => props.updateOperation('weightMap', { ...(op?.weightMap ?? { type: 'uniform', center: { x: 0.5, y: 0.5 }, radius: 0.5 }), radius: Number(e.target.value) })} />
            </label>
            <label>Region Width: {(op?.width ?? 0).toFixed(2)}
              <input type="range" min={0.01} max={1} step={0.01} value={op?.width ?? 0.12} onChange={(e) => props.updateOperation('width', Number(e.target.value))} />
            </label>
          </>
        )}
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
        <label>Direction X: {(op?.direction.x ?? 0).toFixed(2)}
          <input type="range" min={-2} max={2} step={0.05} value={op?.direction.x ?? 0} onChange={(e) => props.updateDirection('x', Number(e.target.value))} />
        </label>
        <label>Direction Y: {(op?.direction.y ?? 0).toFixed(2)}
          <input type="range" min={-2} max={2} step={0.05} value={op?.direction.y ?? 0} onChange={(e) => props.updateDirection('y', Number(e.target.value))} />
        </label>
        <hr />
        <label>
          <input type="checkbox" checked={props.skinSmoothing.enabled} onChange={(e) => props.updateSkinSmoothing({ enabled: e.target.checked })} />
          Enable skin smoothing
        </label>
        <label>Smoothing strength: {props.skinSmoothing.strength.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={props.skinSmoothing.strength} onChange={(e) => props.updateSkinSmoothing({ strength: Number(e.target.value) })} />
        </label>
        <label>Smoothing radius: {props.skinSmoothing.radius.toFixed(2)}
          <input type="range" min={0.5} max={3} step={0.05} value={props.skinSmoothing.radius} onChange={(e) => props.updateSkinSmoothing({ radius: Number(e.target.value) })} />
        </label>
        <label>Mask opacity: {props.skinSmoothing.maskOpacity.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={props.skinSmoothing.maskOpacity} onChange={(e) => props.updateSkinSmoothing({ maskOpacity: Number(e.target.value) })} />
        </label>
        <label>
          <input type="checkbox" checked={props.skinSmoothing.showMaskPreview} onChange={(e) => props.updateSkinSmoothing({ showMaskPreview: e.target.checked })} />
          Show smoothing mask preview
        </label>
        <hr />
        <label>
          <input type="checkbox" checked={props.skinTone.enabled} onChange={(e) => props.updateSkinTone({ enabled: e.target.checked })} />
          Enable skin tone correction
        </label>
        <label>Brightness: {props.skinTone.brightness.toFixed(2)}
          <input type="range" min={-0.2} max={0.2} step={0.01} value={props.skinTone.brightness} onChange={(e) => props.updateSkinTone({ brightness: Number(e.target.value) })} />
        </label>
        <label>Saturation: {props.skinTone.saturation.toFixed(2)}
          <input type="range" min={0} max={2} step={0.01} value={props.skinTone.saturation} onChange={(e) => props.updateSkinTone({ saturation: Number(e.target.value) })} />
        </label>
        <label>Warmth: {props.skinTone.warmth.toFixed(2)}
          <input type="range" min={-1} max={1} step={0.01} value={props.skinTone.warmth} onChange={(e) => props.updateSkinTone({ warmth: Number(e.target.value) })} />
        </label>
        <label>Blend: {props.skinTone.blend.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={props.skinTone.blend} onChange={(e) => props.updateSkinTone({ blend: Number(e.target.value) })} />
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
