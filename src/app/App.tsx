import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { WarpFalloffType } from '@app-types/preset';
import { defaultWarpPreset } from '@algorithms/defaultPreset';
import { createInitialPipelineState } from '@engine/pipeline';
import { applyRadialWarp } from '@engine/math/warp/applyRadialWarp';
import { Panel } from '@ui/Panel';
import { ControlPanel } from '@ui/panels/ControlPanel';
import { JsonOutputPanel } from '@ui/panels/JsonOutputPanel';
import { ProcessedPreviewPanel } from '@ui/panels/ProcessedPreviewPanel';
import { SourcePreviewPanel } from '@ui/panels/SourcePreviewPanel';
import { WarpMathDebugPanel } from '@ui/panels/WarpMathDebugPanel';
import { useBeautyLabRuntime } from './hooks/useBeautyLabRuntime';
import type { RendererMode } from '@engine/render/types';
import type { WarpOperation, WarpPreset } from '@app-types/preset';
import {
  deletePreset,
  exportPresetJson,
  getLastUsedPresetId,
  listPresets,
  loadPreset,
  parseImportedPreset,
  renamePreset,
  savePreset,
  setLastUsedPresetId,
} from '@engine/presets/presetStorage';

const DEBUG_GRID_SIZE = 8;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function App() {
  const [activePreset, setActivePreset] = useState<WarpPreset>(defaultWarpPreset);
  const [activeStoredPresetId, setActiveStoredPresetId] = useState<string | null>(null);
  const [presets, setPresets] = useState(listPresets());
  const [presetNameInput, setPresetNameInput] = useState('My Preset');
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [activeOperationIndex, setActiveOperationIndex] = useState(0);
  const pipelineState = useMemo(() => createInitialPipelineState(activePreset), [activePreset]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showWarpInfluence, setShowWarpInfluence] = useState(true);
  const [showWarpCenter, setShowWarpCenter] = useState(true);
  const [showFalloffRings, setShowFalloffRings] = useState(true);
  const [rendererMode, setRendererMode] = useState<RendererMode>('canvas2d');
  const [debugUv, setDebugUv] = useState({ x: 0.5, y: 0.5 });

  const activeOperation = activePreset.operations[activeOperationIndex] ?? null;
  const runtime = useBeautyLabRuntime(activeOperation, activePreset.operations, {
    showLandmarks, showCenters, showWarpInfluence, showWarpCenter, showFalloffRings,
  }, rendererMode);

  const updateOperation = <K extends keyof (typeof activePreset.operations)[number]>(key: K, value: (typeof activePreset.operations)[number][K]) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, [key]: value } : operation) }));
  };
  const updateAxis = (axisKey: 'x' | 'y', value: number) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, axis: { ...operation.axis, [axisKey]: value } } : operation) }));
  };
  const updateFalloffType = (falloffType: WarpFalloffType) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, falloff: { type: falloffType } } : operation) }));
  };
  const addOperation = () => {
    const newOperation: WarpOperation = {
      id: `operation_${Date.now()}`,
      enabled: true,
      type: 'radial_warp',
      target: 'face_center',
      strength: 0,
      radius: 1,
      falloff: { type: 'smoothstep' },
      axis: { x: 1, y: 1 },
    };
    setActivePreset((currentPreset) => {
      const nextIndex = currentPreset.operations.length;
      setActiveOperationIndex(nextIndex);
      return { ...currentPreset, operations: [...currentPreset.operations, newOperation] };
    });
  };
  const removeOperation = () => {
    setActivePreset((currentPreset) => {
      if (currentPreset.operations.length <= 1) return currentPreset;
      return { ...currentPreset, operations: currentPreset.operations.filter((_, index) => index !== activeOperationIndex) };
    });
    setActiveOperationIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };


  useEffect(() => {
    const lastUsed = getLastUsedPresetId();
    if (!lastUsed) return;
    const stored = loadPreset(lastUsed);
    if (!stored) return;
    setActivePreset(stored.preset);
    setActiveStoredPresetId(stored.id);
    setPresetNameInput(stored.name);
  }, []);

  useEffect(() => {
    if (activeStoredPresetId) {
      setLastUsedPresetId(activeStoredPresetId);
    }
  }, [activeStoredPresetId]);

  const refreshPresets = () => setPresets(listPresets());

  const onSavePreset = () => {
    const saved = savePreset({ id: activeStoredPresetId ?? undefined, name: presetNameInput || 'Untitled preset', preset: activePreset });
    setActiveStoredPresetId(saved.id);
    setPresetNameInput(saved.name);
    setPresetMessage('Preset saved.');
    refreshPresets();
  };
  const onCreatePreset = () => {
    setActiveStoredPresetId(null);
    setActivePreset(defaultWarpPreset);
    setActiveOperationIndex(0);
    setPresetNameInput('New Preset');
    setPresetMessage('Created new unsaved preset.');
  };
  const onDeletePreset = () => {
    if (!activeStoredPresetId) return;
    deletePreset(activeStoredPresetId);
    setActiveStoredPresetId(null);
    setPresetMessage('Preset deleted.');
    refreshPresets();
  };
  const onRenamePreset = () => {
    if (!activeStoredPresetId) return;
    renamePreset(activeStoredPresetId, presetNameInput || 'Untitled preset');
    setPresetMessage('Preset renamed.');
    refreshPresets();
  };
  const onLoadPreset = (id: string) => {
    if (!id) return;
    const stored = loadPreset(id);
    if (!stored) return;
    setActivePreset(stored.preset);
    setActiveStoredPresetId(stored.id);
    setPresetNameInput(stored.name);
    setActiveOperationIndex(0);
    setPresetMessage(`Loaded preset: ${stored.name}`);
  };
  const onExportPreset = async () => {
    const text = exportPresetJson(activePreset);
    await navigator.clipboard.writeText(text);
    setPresetMessage('Preset JSON copied to clipboard.');
  };
  const onImportPresetText = (text: string) => {
    if (!text.trim()) return;
    const parsed = parseImportedPreset(text);
    if (!parsed.ok) {
      setPresetMessage(parsed.error);
      return;
    }
    setActivePreset(parsed.preset);
    setActiveStoredPresetId(null);
    setActiveOperationIndex(0);
    setPresetMessage('Imported preset JSON. Save it to persist.');
  };

  const debugOperation = activeOperation;
  const debugCenter = { x: 0.5, y: 0.5 };
  const debugWarpResult = applyRadialWarp({ uv: debugUv, center: debugCenter, radius: debugOperation?.radius ?? 1, strength: debugOperation?.strength ?? 0, axis: debugOperation?.axis ?? { x: 1, y: 1 }, falloff: debugOperation?.falloff.type ?? 'smoothstep' });
  const debugGridPoints = Array.from({ length: DEBUG_GRID_SIZE * DEBUG_GRID_SIZE }, (_, index) => {
    const gx = index % DEBUG_GRID_SIZE; const gy = Math.floor(index / DEBUG_GRID_SIZE); const uv = { x: gx / (DEBUG_GRID_SIZE - 1), y: gy / (DEBUG_GRID_SIZE - 1) };
    const warped = applyRadialWarp({ uv, center: debugCenter, radius: debugOperation?.radius ?? 1, strength: debugOperation?.strength ?? 0, axis: debugOperation?.axis ?? { x: 1, y: 1 }, falloff: debugOperation?.falloff.type ?? 'smoothstep' });
    return { uv, warpedUv: warped.warpedUv };
  });

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">Beauty AR & Face Warp Lab</h1>
      <div className="panel-grid">
        <SourcePreviewPanel videoRef={runtime.refs.videoRef} overlayCanvasRef={runtime.refs.overlayCanvasRef} cameraState={runtime.state.cameraState} landmarkerState={runtime.state.landmarkerState} cameraErrorMessage={runtime.state.cameraErrorMessage} />
        <ProcessedPreviewPanel processedCanvasRef={runtime.refs.processedCanvasRef} rendererState={runtime.state.rendererState} rendererMode={rendererMode} />
        <Panel title="Face Detection Status"><ul><li>Face: {runtime.state.landmarkFrame?.detected ? 'detected' : 'not detected'}</li><li>Landmark count: {runtime.state.landmarkFrame?.landmarkCount ?? 0}</li><li>Face count: {runtime.state.landmarkFrame?.faceCount ?? 0}</li><li>Frame: {runtime.state.landmarkFrame?.frameCount ?? 0}</li><li>Timestamp (ms): {Math.round(runtime.state.landmarkFrame?.timestampMs ?? 0)}</li></ul></Panel>
        <ControlPanel activePreset={activePreset} presetNameInput={presetNameInput} setPresetNameInput={setPresetNameInput} presets={presets} activeStoredPresetId={activeStoredPresetId} onSavePreset={onSavePreset} onCreatePreset={onCreatePreset} onDeletePreset={onDeletePreset} onRenamePreset={onRenamePreset} onLoadPreset={onLoadPreset} onExportPreset={onExportPreset} onImportPresetText={onImportPresetText} presetMessage={presetMessage} pipelineStatus={pipelineState.status} onStartCamera={runtime.actions.startCamera} onStopCamera={runtime.actions.stopCamera} cameraState={runtime.state.cameraState} showLandmarks={showLandmarks} setShowLandmarks={setShowLandmarks} showCenters={showCenters} setShowCenters={setShowCenters} showWarpInfluence={showWarpInfluence} setShowWarpInfluence={setShowWarpInfluence} showWarpCenter={showWarpCenter} setShowWarpCenter={setShowWarpCenter} showFalloffRings={showFalloffRings} setShowFalloffRings={setShowFalloffRings} rendererMode={rendererMode} setRendererMode={setRendererMode} activeOperationIndex={activeOperationIndex} setActiveOperationIndex={setActiveOperationIndex} addOperation={addOperation} removeOperation={removeOperation} updateOperation={updateOperation} updateAxis={updateAxis} updateFalloffType={updateFalloffType} />
        <WarpMathDebugPanel debugUv={debugUv} debugCenter={debugCenter} debugWarpResult={debugWarpResult} debugGridPoints={debugGridPoints} onMouseMove={(event: MouseEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setDebugUv({ x: clamp01((event.clientX - rect.left) / Math.max(1, rect.width)), y: clamp01((event.clientY - rect.top) / Math.max(1, rect.height)) }); }} />
        <JsonOutputPanel preset={pipelineState.activePreset} geometry={runtime.state.faceGeometry} />
      </div>
    </main>
  );
}
