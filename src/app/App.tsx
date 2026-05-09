import { useMemo, useState, type MouseEvent } from 'react';
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

const DEBUG_GRID_SIZE = 8;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function App() {
  const [activePreset, setActivePreset] = useState(defaultWarpPreset);
  const pipelineState = useMemo(() => createInitialPipelineState(activePreset), [activePreset]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showWarpInfluence, setShowWarpInfluence] = useState(true);
  const [showWarpCenter, setShowWarpCenter] = useState(true);
  const [showFalloffRings, setShowFalloffRings] = useState(true);
  const [rendererMode, setRendererMode] = useState<RendererMode>('canvas2d');
  const [debugUv, setDebugUv] = useState({ x: 0.5, y: 0.5 });

  const runtime = useBeautyLabRuntime(activePreset.operations[0] ?? null, {
    showLandmarks, showCenters, showWarpInfluence, showWarpCenter, showFalloffRings,
  }, rendererMode);

  const updateOperation = <K extends keyof (typeof activePreset.operations)[number]>(key: K, value: (typeof activePreset.operations)[number][K]) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === 0 ? { ...operation, [key]: value } : operation) }));
  };
  const updateAxis = (axisKey: 'x' | 'y', value: number) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === 0 ? { ...operation, axis: { ...operation.axis, [axisKey]: value } } : operation) }));
  };
  const updateFalloffType = (falloffType: WarpFalloffType) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === 0 ? { ...operation, falloff: { type: falloffType } } : operation) }));
  };

  const debugOperation = activePreset.operations[0];
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
        <ControlPanel activePreset={activePreset} pipelineStatus={pipelineState.status} onStartCamera={runtime.actions.startCamera} onStopCamera={runtime.actions.stopCamera} cameraState={runtime.state.cameraState} showLandmarks={showLandmarks} setShowLandmarks={setShowLandmarks} showCenters={showCenters} setShowCenters={setShowCenters} showWarpInfluence={showWarpInfluence} setShowWarpInfluence={setShowWarpInfluence} showWarpCenter={showWarpCenter} setShowWarpCenter={setShowWarpCenter} showFalloffRings={showFalloffRings} setShowFalloffRings={setShowFalloffRings} rendererMode={rendererMode} setRendererMode={setRendererMode} updateOperation={updateOperation} updateAxis={updateAxis} updateFalloffType={updateFalloffType} />
        <WarpMathDebugPanel debugUv={debugUv} debugCenter={debugCenter} debugWarpResult={debugWarpResult} debugGridPoints={debugGridPoints} onMouseMove={(event: MouseEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setDebugUv({ x: clamp01((event.clientX - rect.left) / Math.max(1, rect.width)), y: clamp01((event.clientY - rect.top) / Math.max(1, rect.height)) }); }} />
        <JsonOutputPanel preset={pipelineState.activePreset} geometry={runtime.state.faceGeometry} />
      </div>
    </main>
  );
}
