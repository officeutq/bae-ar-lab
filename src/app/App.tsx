import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { WarpFalloffType } from '@app-types/preset';
import { defaultWarpPreset } from '@algorithms/defaultPreset';
import { samplePresets, type SamplePresetId } from '@algorithms/presets';
import { createInitialPipelineState } from '@engine/pipeline';
import { blendPresetByIntensity } from '@engine/presets/blendPresets';
import { applyWarpOperations } from '@engine/math/warp/applyWarpOperations';
import { Panel } from '@ui/Panel';
import { ControlPanel } from '@ui/panels/ControlPanel';
import { ComparePanel, type CompareCapture } from '@ui/panels/ComparePanel';
import { JsonOutputPanel } from '@ui/panels/JsonOutputPanel';
import { ProcessedPreviewPanel } from '@ui/panels/ProcessedPreviewPanel';
import { SourcePreviewPanel } from '@ui/panels/SourcePreviewPanel';
import { WarpMathDebugPanel } from '@ui/panels/WarpMathDebugPanel';
import { useBeautyLabRuntime } from './hooks/useBeautyLabRuntime';
import type { RendererMode } from '@engine/render/types';
import { detectDeviceCapabilities } from '@engine/performance/detectDeviceCapabilities';
import { createSnapshotExporter } from '@engine/capture/createSnapshotExporter';
import { createTimeline } from '@engine/animation/createTimeline';
import type { WarpOperation, WarpPreset } from '@app-types/preset';
import type { AnimationApplyResult } from '@engine/animation/types';
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
  const [selectedSamplePresetId, setSelectedSamplePresetId] = useState<SamplePresetId | ''>('');
  const [activeOperationIndex, setActiveOperationIndex] = useState(0);
  const [beautyIntensity, setBeautyIntensity] = useState(1);
  const [animationLoop, setAnimationLoop] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [animationTrackCount, setAnimationTrackCount] = useState(0);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const timelineRef = useMemo(() => createTimeline({
    duration: 3,
    tracks: [
      { track: 'beauty.intensity', keyframes: [{ time: 0, value: 0.6 }, { time: 1.5, value: 1 }, { time: 3, value: 0.6 }] },
      { track: 'operations.0.strength', keyframes: [{ time: 0, value: 0 }, { time: 1.5, value: 0.12 }, { time: 3, value: 0 }] },
      { track: 'appearance.skinTone.warmth', keyframes: [{ time: 0, value: 0 }, { time: 3, value: 0.4 }] },
    ],
  }), []);
  const applyAnimatedValues = (preset: WarpPreset, intensity: number, values: Record<string, number>): AnimationApplyResult => {
    const nextPreset: WarpPreset = {
      ...preset,
      operations: preset.operations.map((operation) => ({ ...operation })),
      appearance: preset.appearance ? { ...preset.appearance, skinSmoothing: { ...preset.appearance.skinSmoothing }, skinTone: preset.appearance.skinTone ? { ...preset.appearance.skinTone } : undefined } : undefined,
    };
    let nextIntensity = intensity;
    Object.entries(values).forEach(([track, value]) => {
      if (track === 'beauty.intensity') {
        nextIntensity = clamp01(value);
        return;
      }
      const match = track.match(/^operations\.(\d+)\.(strength|radius)$/);
      if (match) {
        const op = nextPreset.operations[Number(match[1])];
        if (op) op[match[2] as 'strength' | 'radius'] = value;
        return;
      }
      if (track === 'appearance.skinSmoothing.strength' && nextPreset.appearance?.skinSmoothing) nextPreset.appearance.skinSmoothing.strength = value;
      if (track === 'appearance.skinTone.brightness' && nextPreset.appearance?.skinTone) nextPreset.appearance.skinTone.brightness = value;
      if (track === 'appearance.skinTone.saturation' && nextPreset.appearance?.skinTone) nextPreset.appearance.skinTone.saturation = value;
      if (track === 'appearance.skinTone.warmth' && nextPreset.appearance?.skinTone) nextPreset.appearance.skinTone.warmth = value;
      if (track === 'appearance.skinTone.blend' && nextPreset.appearance?.skinTone) nextPreset.appearance.skinTone.blend = value;
    });
    return { preset: nextPreset, beautyIntensity: nextIntensity };
  };

  const animated = applyAnimatedValues(activePreset, beautyIntensity, timelineRef.getSnapshot().values);
  const runtimePreset = useMemo(() => blendPresetByIntensity(animated.preset, animated.beautyIntensity), [animated.preset, animated.beautyIntensity]);
  const pipelineState = useMemo(() => createInitialPipelineState(runtimePreset), [runtimePreset]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showWarpInfluence, setShowWarpInfluence] = useState(true);
  const [showWarpCenter, setShowWarpCenter] = useState(true);
  const [showFalloffRings, setShowFalloffRings] = useState(true);
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);
  const [rendererMode, setRendererMode] = useState<RendererMode>(capabilities.recommendedRendererMode);
  const [debugUv, setDebugUv] = useState({ x: 0.5, y: 0.5 });
  const snapshotExporter = useMemo(() => createSnapshotExporter(), []);
  const [compareCapture, setCompareCapture] = useState<CompareCapture | null>(null);
  useEffect(() => {
    timelineRef.setLoop(animationLoop);
  }, [animationLoop, timelineRef]);

  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    const tick = (now: number) => {
      const deltaSeconds = (now - lastTs) / 1000;
      lastTs = now;
      const snapshot = timelineRef.update(deltaSeconds);
      setAnimationTime(snapshot.currentTime);
      setAnimationTrackCount(snapshot.activeTrackCount);
      setAnimationPlaying(snapshot.state === 'playing');
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timelineRef]);

  useEffect(() => {
    if (!capabilities.webgl2Available && rendererMode === 'webgl') {
      setRendererMode('canvas2d');
    }
  }, [capabilities.webgl2Available, rendererMode]);

  const skinSmoothing = runtimePreset.appearance?.skinSmoothing ?? {
    type: 'skin_smoothing' as const, enabled: true, strength: 0.35, radius: 1, maskOpacity: 1, showMaskPreview: false,
  };
  const skinTone = runtimePreset.appearance?.skinTone ?? {
    type: 'skin_tone' as const, enabled: true, brightness: 0, saturation: 1, warmth: 0, blend: 0.5,
  };

  const activeOperation = runtimePreset.operations[activeOperationIndex] ?? null;
  const runtime = useBeautyLabRuntime(activeOperation, runtimePreset.operations, {
    showLandmarks, showCenters, showWarpInfluence, showWarpCenter, showFalloffRings,
  }, rendererMode, skinSmoothing, skinTone, capabilities.recommendedQuality, capabilities.adaptiveQualityDefaultEnabled);

  const updateOperation = <K extends keyof (typeof activePreset.operations)[number]>(key: K, value: (typeof activePreset.operations)[number][K]) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, [key]: value } : operation) }));
  };
  const updateAxis = (axisKey: 'x' | 'y', value: number) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, axis: { ...operation.axis, [axisKey]: value } } : operation) }));
  };
  const updateFalloffType = (falloffType: WarpFalloffType) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, falloff: { type: falloffType } } : operation) }));
  };
  const updateDirection = (directionKey: 'x' | 'y', value: number) => {
    setActivePreset((currentPreset) => ({ ...currentPreset, operations: currentPreset.operations.map((operation, index) => index === activeOperationIndex ? { ...operation, direction: { ...operation.direction, [directionKey]: value } } : operation) }));
  };
  const updateSkinSmoothing = (patch: Partial<typeof skinSmoothing>) => {
    setActivePreset((currentPreset) => ({
      ...currentPreset,
      appearance: {
        skinSmoothing: {
          ...(currentPreset.appearance?.skinSmoothing ?? skinSmoothing),
          ...patch,
        },
        skinTone: currentPreset.appearance?.skinTone ?? skinTone,
      },
    }));
  };
  const updateSkinTone = (patch: Partial<typeof skinTone>) => {
    setActivePreset((currentPreset) => ({
      ...currentPreset,
      appearance: {
        skinSmoothing: currentPreset.appearance?.skinSmoothing ?? skinSmoothing,
        skinTone: {
          ...(currentPreset.appearance?.skinTone ?? skinTone),
          ...patch,
        },
      },
    }));
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
      direction: { x: 0, y: 0 },
      lineStart: { x: 0.3, y: 0.5 },
      lineEnd: { x: 0.7, y: 0.5 },
      width: 0.12,
      polygon: [{ x: 0.35, y: 0.35 }, { x: 0.65, y: 0.35 }, { x: 0.65, y: 0.65 }, { x: 0.35, y: 0.65 }],
      weightMap: { type: 'uniform', center: { x: 0.5, y: 0.5 }, radius: 0.5 },
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
    setSelectedSamplePresetId('');
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
  const onSelectSamplePreset = (id: SamplePresetId) => {
    const sample = samplePresets[id];
    if (!sample) {
      return;
    }
    setActivePreset(sample.preset);
    setSelectedSamplePresetId(id);
    setActiveStoredPresetId(null);
    setActiveOperationIndex(0);
    setPresetNameInput(sample.label);
    setPresetMessage(`Loaded sample preset: ${sample.label}`);
  };

  const onLoadPreset = (id: string) => {
    if (!id) return;
    const stored = loadPreset(id);
    if (!stored) return;
    setActivePreset(stored.preset);
    setActiveStoredPresetId(stored.id);
    setSelectedSamplePresetId('');
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
    setSelectedSamplePresetId('');
    setActiveOperationIndex(0);
    setPresetMessage('Imported preset JSON. Save it to persist.');
  };


  const onCaptureSource = () => {
    const result = snapshotExporter.exportVideoSnapshot(runtime.refs.videoRef.current, 'source');
    setPresetMessage(result.ok ? `Captured: ${result.filename}` : result.reason);
  };

  const onCaptureProcessed = () => {
    const result = snapshotExporter.exportCanvasSnapshot(runtime.refs.processedCanvasRef.current, 'processed');
    setPresetMessage(result.ok ? `Captured: ${result.filename}` : result.reason);
  };


  const onCaptureCompare = () => {
    const beforeDataUrl = snapshotExporter.readVideoSnapshotDataUrl(runtime.refs.videoRef.current);
    const afterDataUrl = snapshotExporter.readCanvasSnapshotDataUrl(runtime.refs.processedCanvasRef.current);

    if (!beforeDataUrl || !afterDataUrl) {
      setPresetMessage('Compare capture failed: source/processed frame is unavailable.');
      return;
    }

    setCompareCapture({
      beforeDataUrl,
      afterDataUrl,
      capturedAt: new Date().toISOString(),
      presetName: presetNameInput || 'Untitled preset',
    });
    setPresetMessage('Compare capture completed.');
  };

  const resolvedActiveOperation = runtime.resolved.getActiveOperation();
  const debugOperation = resolvedActiveOperation;
  const debugCenter = { x: 0.5, y: 0.5 };
  const debugGeometry = {
    leftEyeCenter: debugCenter, rightEyeCenter: debugCenter, mouthCenter: debugCenter, noseCenter: debugCenter, faceCenter: debugCenter, leftEyeWidth: 1, rightEyeWidth: 1, mouthWidth: 1, faceWidth: 1, leftJawLine: { start: debugCenter, end: debugCenter }, rightJawLine: { start: debugCenter, end: debugCenter }, chinLine: { start: debugCenter, end: debugCenter },
    leftCheekPolygon: [debugCenter, debugCenter, debugCenter],
    rightCheekPolygon: [debugCenter, debugCenter, debugCenter],
    jawPolygon: [debugCenter, debugCenter, debugCenter],
  };
  const debugWarpResult = applyWarpOperations(debugUv, debugOperation ? [debugOperation] : [], debugGeometry);
  const debugGridPoints = Array.from({ length: DEBUG_GRID_SIZE * DEBUG_GRID_SIZE }, (_, index) => {
    const gx = index % DEBUG_GRID_SIZE; const gy = Math.floor(index / DEBUG_GRID_SIZE); const uv = { x: gx / (DEBUG_GRID_SIZE - 1), y: gy / (DEBUG_GRID_SIZE - 1) };
    const warpedUv = applyWarpOperations(uv, debugOperation ? [debugOperation] : [], debugGeometry);
    return { uv, warpedUv };
  });

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">Beauty AR & Face Warp Lab</h1>
      <div className="panel-grid">
        <SourcePreviewPanel videoRef={runtime.refs.videoRef} overlayCanvasRef={runtime.refs.overlayCanvasRef} cameraState={runtime.state.cameraState} landmarkerState={runtime.state.landmarkerState} cameraErrorMessage={runtime.state.cameraErrorMessage} onCaptureSource={onCaptureSource} />
        <ProcessedPreviewPanel processedCanvasRef={runtime.refs.processedCanvasRef} rendererState={runtime.state.rendererState} rendererMode={rendererMode} onCaptureProcessed={onCaptureProcessed} />
        <Panel title="Face Detection Status"><ul><li>Face: {runtime.state.landmarkFrame?.detected ? 'detected' : 'not detected'}</li><li>Landmark count: {runtime.state.landmarkFrame?.landmarkCount ?? 0}</li><li>Face count: {runtime.state.landmarkFrame?.faceCount ?? 0}</li><li>Frame: {runtime.state.landmarkFrame?.frameCount ?? 0}</li><li>Timestamp (ms): {Math.round(runtime.state.landmarkFrame?.timestampMs ?? 0)}</li></ul></Panel>
        <Panel title="Realtime Profiler">
          <div className="profiler-overlay">
            <div>FPS: {runtime.profiler.fps.toFixed(1)}</div>
            <div>AVG FPS (30): {runtime.profiler.avgFps30.toFixed(1)}</div>
            <div>Frame (ms): {runtime.profiler.frameTimeMs.toFixed(2)}</div>
            <div>AVG Frame (ms): {runtime.profiler.avgFrameTimeMs30.toFixed(2)}</div>
            <div>Backend: {runtime.profiler.backend}</div>
            <div>MediaPipe (ms): {runtime.profiler.mediapipeMs.toFixed(2)}</div>
            <div>Render (ms): {runtime.profiler.renderMs.toFixed(2)}</div>
            <div>Operation count: {runtime.profiler.operationCount}</div>
            <div>Quality: {runtime.quality.runtimeQuality}</div>
            <div>Render scale: {runtime.quality.runtimePreset.renderScale.toFixed(2)}</div>
            <div>Device: {capabilities.deviceType}</div>
            <div>WebGL2: {capabilities.webgl2Available ? 'available' : 'unavailable'}</div>
            <div>Memory (GB): {capabilities.deviceMemoryGb ?? 'n/a'}</div>
            <div>Cores: {capabilities.hardwareConcurrency ?? 'n/a'}</div>
            <div>Recommended quality: {capabilities.recommendedQuality}</div>
          </div>
        </Panel>
        <ControlPanel activePreset={activePreset} beautyIntensity={beautyIntensity} setBeautyIntensity={setBeautyIntensity} animationPlaying={animationPlaying} animationTime={animationTime} animationLoop={animationLoop} animationTrackCount={animationTrackCount} onPlayAnimation={() => timelineRef.play()} onPauseAnimation={() => timelineRef.pause()} onStopAnimation={() => timelineRef.stop()} onTimelineTimeChange={(value) => timelineRef.setTime(value)} setAnimationLoop={setAnimationLoop} onCaptureCompare={onCaptureCompare} presetNameInput={presetNameInput} setPresetNameInput={setPresetNameInput} presets={presets} activeStoredPresetId={activeStoredPresetId} onSavePreset={onSavePreset} onCreatePreset={onCreatePreset} onDeletePreset={onDeletePreset} onRenamePreset={onRenamePreset} onLoadPreset={onLoadPreset} selectedSamplePresetId={selectedSamplePresetId} onSelectSamplePreset={onSelectSamplePreset} onExportPreset={onExportPreset} onImportPresetText={onImportPresetText} presetMessage={presetMessage} pipelineStatus={pipelineState.status} onStartCamera={runtime.actions.startCamera} onStopCamera={runtime.actions.stopCamera} cameraState={runtime.state.cameraState} showLandmarks={showLandmarks} setShowLandmarks={setShowLandmarks} showCenters={showCenters} setShowCenters={setShowCenters} showWarpInfluence={showWarpInfluence} setShowWarpInfluence={setShowWarpInfluence} showWarpCenter={showWarpCenter} setShowWarpCenter={setShowWarpCenter} showFalloffRings={showFalloffRings} setShowFalloffRings={setShowFalloffRings} rendererMode={rendererMode} setRendererMode={setRendererMode} activeOperationIndex={activeOperationIndex} setActiveOperationIndex={setActiveOperationIndex} addOperation={addOperation} removeOperation={removeOperation} updateOperation={updateOperation} updateAxis={updateAxis} updateFalloffType={updateFalloffType} updateDirection={updateDirection} resolvedActiveOperation={resolvedActiveOperation} skinSmoothing={skinSmoothing} updateSkinSmoothing={updateSkinSmoothing} skinTone={skinTone} updateSkinTone={updateSkinTone} adaptiveQualityEnabled={runtime.quality.adaptiveQuality.enabled} onAdaptiveQualityEnabledChange={runtime.quality.setAdaptiveEnabled} selectedQuality={runtime.quality.adaptiveQuality.selectedQuality} currentQuality={runtime.quality.runtimeQuality} onSelectedQualityChange={runtime.quality.setSelectedQuality} capabilities={capabilities} />
        <ComparePanel capture={compareCapture} />
        <WarpMathDebugPanel debugUv={debugUv} debugCenter={debugCenter} debugWarpResult={{ warpedUv: debugWarpResult, influence: 0 }} debugGridPoints={debugGridPoints} onMouseMove={(event: MouseEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setDebugUv({ x: clamp01((event.clientX - rect.left) / Math.max(1, rect.width)), y: clamp01((event.clientY - rect.top) / Math.max(1, rect.height)) }); }} />
        <JsonOutputPanel preset={pipelineState.activePreset} geometry={runtime.state.faceGeometry} />
      </div>
    </main>
  );
}
