import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { AdaptiveQualityReason, QualityLevel } from '@engine/performance/adaptiveQuality';
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
import { TimelinePanel } from '@ui/panels/TimelinePanel';
import { WarpMathDebugPanel } from '@ui/panels/WarpMathDebugPanel';
import { RuntimeDebugPanel } from '@ui/panels/RuntimeDebugPanel';
import { renderBeautyDebugOverlay, type BeautyDebugOverlayMode } from '@engine/overlay/beautyDebugOverlay';
import { useBeautyLabRuntime } from './hooks/useBeautyLabRuntime';
import type { RendererMode } from '@engine/render/types';
import { detectDeviceCapabilities } from '@engine/performance/detectDeviceCapabilities';
import { DEFAULT_DEVELOPER_TUNING, type DeveloperTuningState } from '@engine/tuning/developerTuning';
import { createSnapshotExporter } from '@engine/capture/createSnapshotExporter';
import { createTimeline } from '@engine/animation/createTimeline';
import type { WarpOperation, WarpPreset } from '@app-types/preset';
import type { AnimationApplyResult, AnimationClip } from '@engine/animation/types';
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
const clampKeyframeTime = (value: number, duration: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, value), Math.max(0, duration));
};
const DEFAULT_ANIMATION_CLIP: AnimationClip = {
  id: 'runtime_default',
  name: 'Runtime Default',
  duration: 3,
  loop: false,
  tracks: [
    { track: 'beauty.intensity', keyframes: [{ time: 0, value: 0.8 }, { time: 1.5, value: 1 }, { time: 3, value: 0.8 }] },
    { track: 'appearance.skinTone.warmth', keyframes: [{ time: 0, value: 0 }, { time: 3, value: 0.4 }] },
  ],
};

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
  const [selectedAnimationClipId, setSelectedAnimationClipId] = useState<string>('runtime_default');
  const [loadedAnimationClip, setLoadedAnimationClip] = useState<AnimationClip>(DEFAULT_ANIMATION_CLIP);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(0);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState<number | null>(0);
  const animationClips = useMemo(() => [DEFAULT_ANIMATION_CLIP, ...(activePreset.animations ?? [])], [activePreset]);
  const selectedAnimationClip = useMemo(
    () => animationClips.find((clip) => clip.id === selectedAnimationClipId) ?? null,
    [animationClips, selectedAnimationClipId],
  );
  const timelineRef = useMemo(() => createTimeline(loadedAnimationClip), [loadedAnimationClip]);

  const selectKeyframe = (trackIndex: number, keyframeIndex: number) => {
    setSelectedTrackIndex(trackIndex);
    setSelectedKeyframeIndex(keyframeIndex);
  };
  const selectAdjacentKeyframe = (direction: -1 | 1) => {
    const flattened = loadedAnimationClip.tracks.flatMap((track, trackIndex) => track.keyframes.map((_, keyframeIndex) => ({ trackIndex, keyframeIndex })));
    if (flattened.length === 0) return;
    const currentIndex = flattened.findIndex((item) => item.trackIndex === selectedTrackIndex && item.keyframeIndex === selectedKeyframeIndex);
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.min(flattened.length - 1, Math.max(0, baseIndex + direction));
    const next = flattened[nextIndex];
    selectKeyframe(next.trackIndex, next.keyframeIndex);
  };
  const sortKeyframesByTime = <T extends { time: number }>(keyframes: T[]) => [...keyframes].sort((a, b) => a.time - b.time);
  const updateClipKeyframeTime = (clip: AnimationClip, trackIndex: number, keyframeIndex: number, time: number) => {
    const nextTracks = clip.tracks.map((track, tIndex) => {
      if (tIndex !== trackIndex) return track;
      const nextKeyframes = track.keyframes.map((keyframe, kIndex) => (
        kIndex === keyframeIndex
          ? { ...keyframe, time: clampKeyframeTime(time, clip.duration) }
          : keyframe
      ));
      const sortedKeyframes = sortKeyframesByTime(nextKeyframes);
      const nextSelectedIndex = sortedKeyframes.findIndex((keyframe) => keyframe === nextKeyframes[keyframeIndex]);
      setSelectedTrackIndex(trackIndex);
      setSelectedKeyframeIndex(nextSelectedIndex >= 0 ? nextSelectedIndex : keyframeIndex);
      return {
        ...track,
        keyframes: sortedKeyframes,
      };
    });
    return {
      ...clip,
      tracks: nextTracks,
    };
  };

  const syncTimelineSnapshot = () => {
    const snapshot = timelineRef.getSnapshot();
    setAnimationTime(snapshot.currentTime);
    setAnimationTrackCount(snapshot.activeTrackCount);
    setAnimationPlaying(snapshot.state === 'playing');
  };
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

  const timelineSnapshot = timelineRef.getSnapshot();
  const animated = applyAnimatedValues(activePreset, beautyIntensity, timelineSnapshot.values);
  const debugWarpStrongBypassEnabled = selectedSamplePresetId === 'debug_warp_strong_bypass';
  const effectiveBeautyIntensity = debugWarpStrongBypassEnabled ? 1 : animated.beautyIntensity;
  const runtimePreset = useMemo(
    () => blendPresetByIntensity(animated.preset, effectiveBeautyIntensity),
    [animated.preset, effectiveBeautyIntensity],
  );
  const pipelineState = useMemo(() => createInitialPipelineState(runtimePreset), [runtimePreset]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showWarpInfluence, setShowWarpInfluence] = useState(true);
  const [showWarpCenter, setShowWarpCenter] = useState(true);
  const [showFalloffRings, setShowFalloffRings] = useState(true);
  const [beautyDebugOverlayMode, setBeautyDebugOverlayMode] = useState<BeautyDebugOverlayMode>('off');
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);
  const [rendererMode, setRendererMode] = useState<RendererMode>(capabilities.recommendedRendererMode);
  const [debugUv, setDebugUv] = useState({ x: 0.5, y: 0.5 });
  const snapshotExporter = useMemo(() => createSnapshotExporter(), []);
  const [compareCapture, setCompareCapture] = useState<CompareCapture | null>(null);
  const [developerTuning, setDeveloperTuning] = useState<DeveloperTuningState>(DEFAULT_DEVELOPER_TUNING);
  const [adaptiveQualityHud, setAdaptiveQualityHud] = useState<{ visible: boolean; from: QualityLevel; to: QualityLevel; reason: AdaptiveQualityReason }>({
    visible: false,
    from: capabilities.recommendedQuality,
    to: capabilities.recommendedQuality,
    reason: 'manual',
  });

  useEffect(() => {
    (globalThis as { __BEAUTY_WEBGL_WARP_GAIN__?: number }).__BEAUTY_WEBGL_WARP_GAIN__ = developerTuning.debug.webglWarpGain;
  }, [developerTuning.debug.webglWarpGain]);
  useEffect(() => {
    timelineRef.setLoop(typeof loadedAnimationClip.loop === 'boolean' ? loadedAnimationClip.loop : animationLoop);
  }, [animationLoop, timelineRef]);

  useEffect(() => {
    if (!animationClips.some((clip) => clip.id === selectedAnimationClipId)) {
      setSelectedAnimationClipId('runtime_default');
      setLoadedAnimationClip(DEFAULT_ANIMATION_CLIP);
    }
  }, [animationClips, selectedAnimationClipId]);

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
  }, rendererMode, skinSmoothing, skinTone, developerTuning, capabilities.recommendedQuality, capabilities.adaptiveQualityDefaultEnabled, {
    disablePoseAttenuation: debugWarpStrongBypassEnabled,
    disableAdaptiveQuality: debugWarpStrongBypassEnabled,
  });

  useEffect(() => {
    let hideTimer = 0;
    setAdaptiveQualityHud((current) => {
      if (runtime.quality.adaptiveQuality.reason === 'stable'
        || runtime.quality.adaptiveQuality.reason === 'warmup'
        || runtime.quality.adaptiveQuality.reason === 'insufficient_samples'
        || runtime.quality.adaptiveQuality.reason === 'manual') return current;
      if (current.to === runtime.quality.runtimeQuality && current.reason === runtime.quality.adaptiveQuality.reason) return current;
      return {
        visible: true,
        from: current.to,
        to: runtime.quality.runtimeQuality,
        reason: runtime.quality.adaptiveQuality.reason,
      };
    });
    if (runtime.quality.adaptiveQuality.reason === 'fps_drop' || runtime.quality.adaptiveQuality.reason === 'fps_recovered') {
      hideTimer = window.setTimeout(() => {
        setAdaptiveQualityHud((current) => ({ ...current, visible: false }));
      }, 3000);
    }
    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [runtime.quality.runtimeQuality, runtime.quality.adaptiveQuality.reason]);


  useEffect(() => {
    const overlayCanvas = runtime.refs.beautyDebugOverlayCanvasRef.current;
    const activeCanvas = rendererMode === 'webgl' ? runtime.refs.webglCanvasRef.current : runtime.refs.canvas2dRef.current;
    if (!overlayCanvas || !activeCanvas) return;
    overlayCanvas.width = activeCanvas.width;
    overlayCanvas.height = activeCanvas.height;
    renderBeautyDebugOverlay(overlayCanvas, {
      mode: beautyDebugOverlayMode,
      faceGeometry: runtime.state.faceGeometry,
      operations: runtime.resolved.getOperations(),
      poseAttenuationFactor: runtime.pose.poseAttenuation.factor,
      faceStabilityFade: runtime.faceStability.fade,
    });
  }, [runtime, rendererMode, beautyDebugOverlayMode, runtime.overlayFrame, runtime.state.faceGeometry, runtime.pose.poseAttenuation.factor, runtime.faceStability.fade]);

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
  const updateSelectedAnimationClip = (updater: (clip: AnimationClip) => AnimationClip) => {
    if (selectedAnimationClipId === DEFAULT_ANIMATION_CLIP.id) {
      setLoadedAnimationClip((currentClip) => currentClip.id === DEFAULT_ANIMATION_CLIP.id ? updater(currentClip) : currentClip);
      return;
    }
    setActivePreset((currentPreset) => {
      const animations = currentPreset.animations ?? [];
      return {
        ...currentPreset,
        animations: animations.map((clip) => clip.id === selectedAnimationClipId ? updater(clip) : clip),
      };
    });
  };
  const addKeyframeAtTime = (trackIndex: number, time: number) => {
    const clampedTime = clampKeyframeTime(time, loadedAnimationClip.duration);
    updateSelectedAnimationClip((clip) => {
      const nextTracks = clip.tracks.map((track, tIndex) => {
        if (tIndex !== trackIndex) return track;
        const currentValue = Number(timelineSnapshot.values[track.track] ?? 0);
        const nextKeyframes = sortKeyframesByTime([...track.keyframes, { time: clampedTime, value: currentValue }]);
        const insertedIndex = nextKeyframes.findIndex((keyframe) => keyframe.time === clampedTime && keyframe.value === currentValue);
        setSelectedTrackIndex(trackIndex);
        setSelectedKeyframeIndex(insertedIndex >= 0 ? insertedIndex : nextKeyframes.length - 1);
        return { ...track, keyframes: nextKeyframes };
      });
      return { ...clip, tracks: nextTracks };
    });
  };
  const addSelectedTrackKeyframe = () => {
    const trackIndex = selectedTrackIndex ?? 0;
    if (!loadedAnimationClip.tracks[trackIndex]) return;
    addKeyframeAtTime(trackIndex, animationTime);
  };
  const deleteSelectedKeyframe = () => {
    if (selectedTrackIndex === null || selectedKeyframeIndex === null) return;
    updateSelectedAnimationClip((clip) => {
      const track = clip.tracks[selectedTrackIndex];
      if (!track || !track.keyframes[selectedKeyframeIndex]) return clip;
      const nextKeyframes = track.keyframes.filter((_, index) => index !== selectedKeyframeIndex);
      const nextTracks = clip.tracks.map((item, index) => index === selectedTrackIndex ? { ...item, keyframes: nextKeyframes } : item);
      setSelectedKeyframeIndex(nextKeyframes.length === 0 ? null : Math.min(selectedKeyframeIndex, nextKeyframes.length - 1));
      return { ...clip, tracks: nextTracks };
    });
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
    setSelectedAnimationClipId('runtime_default');
    setLoadedAnimationClip(DEFAULT_ANIMATION_CLIP);
    setPresetNameInput(sample.label);
    if (id === 'debug_warp_strong_bypass') {
      setBeautyIntensity(1);
    }
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
    setSelectedAnimationClipId('runtime_default');
    setLoadedAnimationClip(DEFAULT_ANIMATION_CLIP);
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
    setSelectedAnimationClipId('runtime_default');
    setLoadedAnimationClip(DEFAULT_ANIMATION_CLIP);
    setPresetMessage('Imported preset JSON. Save it to persist.');
  };


  const onCaptureSource = () => {
    const result = snapshotExporter.exportVideoSnapshot(runtime.refs.videoRef.current, 'source');
    setPresetMessage(result.ok ? `Captured: ${result.filename}` : result.reason);
  };

  const getActiveProcessedCanvas = () => {
    const preferredCanvas = rendererMode === 'webgl' ? runtime.refs.webglCanvasRef.current : runtime.refs.canvas2dRef.current;
    const fallbackCanvas = rendererMode === 'webgl' ? runtime.refs.canvas2dRef.current : runtime.refs.webglCanvasRef.current;
    const isDrawable = (canvas: HTMLCanvasElement | null) => Boolean(canvas && canvas.width > 0 && canvas.height > 0);

    if (isDrawable(preferredCanvas)) {
      return preferredCanvas;
    }
    if (isDrawable(fallbackCanvas)) {
      return fallbackCanvas;
    }
    return preferredCanvas;
  };

  const onCaptureProcessed = () => {
    const result = snapshotExporter.exportCanvasSnapshot(getActiveProcessedCanvas(), 'processed');
    setPresetMessage(result.ok ? `Captured: ${result.filename}` : result.reason);
  };


  const onCaptureCompare = () => {
    const beforeDataUrl = snapshotExporter.readVideoSnapshotDataUrl(runtime.refs.videoRef.current);
    const afterDataUrl = snapshotExporter.readCanvasSnapshotDataUrl(getActiveProcessedCanvas());

    if (!beforeDataUrl || !afterDataUrl) {
      setPresetMessage('比較キャプチャに失敗しました: 元映像または加工映像が取得できません。');
      return;
    }

    setCompareCapture({
      beforeDataUrl,
      afterDataUrl,
      capturedAt: new Date().toISOString(),
      presetName: presetNameInput || '未命名プリセット',
    });
    setPresetMessage('比較キャプチャが完了しました。');
  };

  const resolvedActiveOperation = runtime.resolved.getActiveOperation();
  const previewAspectRatio = `${runtime.state.previewSize.width > 0 ? runtime.state.previewSize.width : 16} / ${runtime.state.previewSize.height > 0 ? runtime.state.previewSize.height : 9}`;
  const debugOperation = resolvedActiveOperation;
  const debugCenter = { x: 0.5, y: 0.5 };
  const debugGeometry = {
    leftEyeCenter: debugCenter, rightEyeCenter: debugCenter, mouthCenter: debugCenter, noseCenter: debugCenter, faceCenter: debugCenter, leftEyeWidth: 1, rightEyeWidth: 1, mouthWidth: 1, faceWidth: 1, leftJawLine: { start: debugCenter, end: debugCenter }, rightJawLine: { start: debugCenter, end: debugCenter }, chinLine: { start: debugCenter, end: debugCenter },
    leftCheekPolygon: [debugCenter, debugCenter, debugCenter],
    rightCheekPolygon: [debugCenter, debugCenter, debugCenter],
    jawPolygon: [debugCenter, debugCenter, debugCenter],
  };
  const firstActiveOperationSummary = (() => {
    const first = runtime.resolved.getOperations().find((operation) => operation.enabled);
    if (!first) return 'none';
    return `${first.type} / ${first.target} / strength ${first.strength.toFixed(3)}`;
  })();
  const rawOperationStrengthSummary = activePreset.operations
    .filter((operation) => operation.enabled)
    .map((operation, index) => `#${index} ${operation.type} ${operation.target} ${operation.strength.toFixed(3)}`);
  const intensityOperationStrengthSummary = animated.preset.operations
    .filter((operation) => operation.enabled)
    .map((operation, index) => `#${index} ${operation.type} ${operation.target} ${operation.strength.toFixed(3)}`);
  const resolvedOperationStrengthSummary = runtime.resolved.getOperations()
    .filter((operation) => operation.enabled)
    .map((operation, index) => `#${index} ${operation.type} ${operation.target} ${operation.strength.toFixed(3)}`);
  const effectiveMultiplierSummary = activePreset.operations
    .map((operation, index) => {
      if (!operation.enabled) return null;
      const resolved = runtime.resolved.getOperations()[index];
      const multiplier = Math.abs(operation.strength) > 1e-6 && resolved
        ? resolved.strength / operation.strength
        : 0;
      return `#${index} ${operation.type} ${operation.target} x${multiplier.toFixed(3)}`;
    })
    .filter((line): line is string => Boolean(line));

  const debugWarpResult = applyWarpOperations(debugUv, debugOperation ? [debugOperation] : [], debugGeometry);
  const debugGridPoints = Array.from({ length: DEBUG_GRID_SIZE * DEBUG_GRID_SIZE }, (_, index) => {
    const gx = index % DEBUG_GRID_SIZE; const gy = Math.floor(index / DEBUG_GRID_SIZE); const uv = { x: gx / (DEBUG_GRID_SIZE - 1), y: gy / (DEBUG_GRID_SIZE - 1) };
    const warpedUv = applyWarpOperations(uv, debugOperation ? [debugOperation] : [], debugGeometry);
    return { uv, warpedUv };
  });

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">ビューティーAR・フェイスワープ実験ラボ</h1>
      <section className="runtime-controls" aria-label="Runtime Controls">
        <h2 className="runtime-controls__title">Runtime Controls（実行コントロール）</h2>
        <div className="runtime-controls__actions">
          <button type="button" onClick={runtime.actions.startCamera} disabled={runtime.state.cameraState === 'starting' || runtime.state.cameraState === 'running'}>
            カメラ起動
          </button>
          <button type="button" onClick={runtime.actions.stopCamera} disabled={runtime.state.cameraState !== 'running'}>
            カメラ停止
          </button>
          <label className="runtime-controls__field">
            <span>Renderer Backend</span>
            <select value={rendererMode} onChange={(event) => setRendererMode(event.target.value as RendererMode)}>
              <option value="canvas2d">canvas2d</option>
              <option value="cpu_warp_debug">cpu_warp_debug</option>
              <option value="webgl" disabled={!capabilities.webgl2Available}>webgl</option>
            </select>
          </label>
        </div>
        <div className="runtime-controls__status">
          <span>camera: {runtime.state.cameraState}</span>
          <span>landmarker: {runtime.state.landmarkerState}</span>
          <span>renderer: {rendererMode}</span>
        </div>
      </section>
      <div className="panel-grid">
        <SourcePreviewPanel videoRef={runtime.refs.videoRef} overlayCanvasRef={runtime.refs.overlayCanvasRef} cameraState={runtime.state.cameraState} landmarkerState={runtime.state.landmarkerState} cameraErrorMessage={runtime.state.cameraErrorMessage} onCaptureSource={onCaptureSource} previewAspectRatio={previewAspectRatio} />
        <ProcessedPreviewPanel canvas2dRef={runtime.refs.canvas2dRef} webglCanvasRef={runtime.refs.webglCanvasRef} beautyDebugOverlayCanvasRef={runtime.refs.beautyDebugOverlayCanvasRef} rendererState={runtime.state.rendererState} rendererMode={rendererMode} beautyDebugOverlayMode={beautyDebugOverlayMode} adaptiveQualityHud={{ ...adaptiveQualityHud, preset: runtime.quality.runtimePreset }} onCaptureProcessed={onCaptureProcessed} previewAspectRatio={previewAspectRatio} />
        <Panel title="顔検出ステータス"><ul><li>顔: {runtime.state.landmarkFrame?.detected ? '検出中' : '顔が検出されていません'}</li><li>ランドマーク数: {runtime.state.landmarkFrame?.landmarkCount ?? 0}</li><li>顔数: {runtime.state.landmarkFrame?.faceCount ?? 0}</li><li>フレーム: {runtime.state.landmarkFrame?.frameCount ?? 0}</li><li>タイムスタンプ (ms): {Math.round(runtime.state.landmarkFrame?.timestampMs ?? 0)}</li></ul></Panel>
        <Panel title="リアルタイムプロファイラ">
          <div className="profiler-overlay">
            <div>FPS: {runtime.profiler.fps.toFixed(1)}</div>
            <div>AVG FPS (window): {runtime.profiler.avgFps30.toFixed(1)}</div>
            <div>Frame (ms): {runtime.profiler.frameTimeMs.toFixed(2)}</div>
            <div>AVG Frame (ms): {runtime.profiler.avgFrameTimeMs30.toFixed(2)}</div>
            <div>Backend: {runtime.profiler.backend}</div>
            <div>MediaPipe (ms): {runtime.profiler.mediapipeMs.toFixed(2)}</div>
            <div>Render (ms): {runtime.profiler.renderMs.toFixed(2)}</div>
            <div>Operation count: {runtime.profiler.operationCount}</div>
            <div>Yaw (deg): {runtime.pose.facePose?.yaw.toFixed(1) ?? 'n/a'}</div>
            <div>Pitch (deg): {runtime.pose.facePose?.pitch.toFixed(1) ?? 'n/a'}</div>
            <div>Roll (deg): {runtime.pose.facePose?.roll.toFixed(1) ?? 'n/a'}</div>
            <div>Pose attenuation: {runtime.pose.poseAttenuation.factor.toFixed(2)}</div>
            <div>Face stability: {runtime.faceStability.status}</div>
            <div>Stability fade: {runtime.faceStability.fade.toFixed(2)}</div>
            <div>Quality: {runtime.quality.runtimeQuality}</div>
            <div>Render scale: {runtime.quality.runtimePreset.renderScale.toFixed(2)}</div>
            <div>Device: {capabilities.deviceType}</div>
            <div>WebGL2: {capabilities.webgl2Available ? '利用可能' : '利用不可'}</div>
            <div>メモリ (GB): {capabilities.deviceMemoryGb ?? 'n/a'}</div>
            <div>CPUコア数: {capabilities.hardwareConcurrency ?? 'n/a'}</div>
            <div>推奨品質: {capabilities.recommendedQuality}</div>
          </div>
        </Panel>
        <RuntimeDebugPanel
          temporalSmoothingEnabled={true}
          temporalSmoothingAlpha={developerTuning.temporal.operationSmoothingAlpha}
          faceDetected={Boolean(runtime.state.landmarkFrame?.detected)}
          faceStability={runtime.faceStability}
          facePose={runtime.pose.facePose}
          poseAttenuationFactor={runtime.pose.poseAttenuation.factor}
          poseAttenuationYawFactor={runtime.pose.poseAttenuation.yawFactor}
          poseAttenuationPitchFactor={runtime.pose.poseAttenuation.pitchFactor}
          activeOperationCount={runtime.warpDebug.activeOperationCount}
          resolvedOperationCount={runtime.warpDebug.resolvedOperationCount}
          filteredOperationCount={runtime.warpDebug.filteredOperationCount}
          warpStrengthScale={runtime.quality.runtimePreset.warpStrengthScale}
          firstActiveOperationSummary={firstActiveOperationSummary}
          beautyIntensity={beautyIntensity}
          animatedBeautyIntensity={animated.beautyIntensity}
          rawOperationStrengthSummary={rawOperationStrengthSummary}
          intensityOperationStrengthSummary={intensityOperationStrengthSummary}
          resolvedOperationStrengthSummary={resolvedOperationStrengthSummary}
          effectiveMultiplierSummary={effectiveMultiplierSummary}
          globalAttenuation={runtime.warpDebug.globalAttenuation}
          partAttenuationSummary={`eye=${runtime.warpDebug.eyePartAttenuation.toFixed(3)}`}
          eyePartAttenuation={runtime.warpDebug.eyePartAttenuation}
          finalMultiplier={runtime.warpDebug.finalMultiplier}
          firstEyeOperationSummary={runtime.warpDebug.firstEyeOperationSummary}
          operationRuntimeMultiplierSummary={runtime.warpDebug.operationMultiplierSummary}
          frameSkip={runtime.quality.runtimePreset.frameSkip}
          currentQuality={runtime.quality.runtimeQuality}
          selectedQuality={runtime.quality.adaptiveQuality.selectedQuality}
          adaptiveQualityEnabled={runtime.quality.adaptiveQuality.enabled}
          adaptiveQualityReason={runtime.quality.adaptiveQuality.reason}
          qualityLockRemainingMs={runtime.quality.qualityLockRemainingMs}
          qualityRecoveryElapsedMs={runtime.quality.qualityRecoveryElapsedMs}
          renderScale={runtime.quality.runtimePreset.renderScale}
          rendererMode={rendererMode}
          fps={runtime.profiler.fps}
          frameTimeMs={runtime.profiler.frameTimeMs}
          mediapipeTimeMs={runtime.profiler.mediapipeMs}
          rendererTimeMs={runtime.profiler.renderMs}
        />
        <ControlPanel selectedTrackIndex={selectedTrackIndex} selectedKeyframeIndex={selectedKeyframeIndex} onSelectKeyframe={selectKeyframe} onSelectPrevKeyframe={() => selectAdjacentKeyframe(-1)} onSelectNextKeyframe={() => selectAdjacentKeyframe(1)} activePreset={activePreset} beautyIntensity={beautyIntensity} setBeautyIntensity={setBeautyIntensity} animationPlaying={animationPlaying} animationTime={animationTime} animationLoop={animationLoop} animationTrackCount={animationTrackCount} animationDuration={loadedAnimationClip.duration} animationClips={animationClips} selectedAnimationClipId={selectedAnimationClipId} loadedAnimationClipName={loadedAnimationClip.name} selectedAnimationClip={selectedAnimationClip} onSelectAnimationClip={setSelectedAnimationClipId} onLoadAnimationClip={() => {
          const clip = animationClips.find((item) => item.id === selectedAnimationClipId);
          if (!clip) return;
          setLoadedAnimationClip(clip);
          setAnimationLoop(Boolean(clip.loop));
          setPresetMessage(`Loaded animation clip: ${clip.name}`);
        }} onUpdateSelectedClipName={(value) => updateSelectedAnimationClip((clip) => ({ ...clip, name: value }))} onUpdateSelectedClipDuration={(value) => {
          const safeValue = Number.isFinite(value) ? Math.max(0.01, value) : 0.01;
          updateSelectedAnimationClip((clip) => ({ ...clip, duration: safeValue }));
        }} onUpdateSelectedClipKeyframeTime={(trackIndex, keyframeIndex, value) => updateSelectedAnimationClip((clip) => updateClipKeyframeTime(clip, trackIndex, keyframeIndex, value))} onUpdateSelectedClipLoop={(value) => updateSelectedAnimationClip((clip) => ({ ...clip, loop: value }))} onUpdateSelectedClipKeyframeValue={(trackIndex, keyframeIndex, value) => updateSelectedAnimationClip((clip) => ({
          ...clip,
          tracks: clip.tracks.map((track, tIndex) => tIndex === trackIndex ? {
            ...track,
            keyframes: track.keyframes.map((keyframe, kIndex) => kIndex === keyframeIndex ? { ...keyframe, value } : keyframe),
          } : track),
        }))} onAddKeyframe={addSelectedTrackKeyframe} onDeleteKeyframe={deleteSelectedKeyframe} onPlayAnimation={() => { timelineRef.play(); syncTimelineSnapshot(); }} onPauseAnimation={() => { timelineRef.pause(); syncTimelineSnapshot(); }} onStopAnimation={() => { timelineRef.stop(); syncTimelineSnapshot(); }} onTimelineTimeChange={(value) => { timelineRef.seek(value); syncTimelineSnapshot(); }} setAnimationLoop={setAnimationLoop} onCaptureCompare={onCaptureCompare} presetNameInput={presetNameInput} setPresetNameInput={setPresetNameInput} presets={presets} activeStoredPresetId={activeStoredPresetId} onSavePreset={onSavePreset} onCreatePreset={onCreatePreset} onDeletePreset={onDeletePreset} onRenamePreset={onRenamePreset} onLoadPreset={onLoadPreset} selectedSamplePresetId={selectedSamplePresetId} onSelectSamplePreset={onSelectSamplePreset} onExportPreset={onExportPreset} onImportPresetText={onImportPresetText} presetMessage={presetMessage} pipelineStatus={pipelineState.status} onStartCamera={runtime.actions.startCamera} onStopCamera={runtime.actions.stopCamera} cameraState={runtime.state.cameraState} showLandmarks={showLandmarks} setShowLandmarks={setShowLandmarks} showCenters={showCenters} setShowCenters={setShowCenters} showWarpInfluence={showWarpInfluence} setShowWarpInfluence={setShowWarpInfluence} showWarpCenter={showWarpCenter} setShowWarpCenter={setShowWarpCenter} showFalloffRings={showFalloffRings} setShowFalloffRings={setShowFalloffRings} beautyDebugOverlayMode={beautyDebugOverlayMode} setBeautyDebugOverlayMode={setBeautyDebugOverlayMode} rendererMode={rendererMode} setRendererMode={setRendererMode} activeOperationIndex={activeOperationIndex} setActiveOperationIndex={setActiveOperationIndex} addOperation={addOperation} removeOperation={removeOperation} updateOperation={updateOperation} updateAxis={updateAxis} updateFalloffType={updateFalloffType} updateDirection={updateDirection} resolvedActiveOperation={resolvedActiveOperation} skinSmoothing={skinSmoothing} updateSkinSmoothing={updateSkinSmoothing} skinTone={skinTone} updateSkinTone={updateSkinTone} adaptiveQualityEnabled={runtime.quality.adaptiveQuality.enabled} onAdaptiveQualityEnabledChange={runtime.quality.setAdaptiveEnabled} selectedQuality={runtime.quality.adaptiveQuality.selectedQuality} currentQuality={runtime.quality.runtimeQuality} onSelectedQualityChange={runtime.quality.setSelectedQuality} capabilities={capabilities} temporalSmoothingEnabled={true} setTemporalSmoothingEnabled={()=>{}} temporalSmoothingAmount={developerTuning.temporal.operationSmoothingAlpha} setTemporalSmoothingAmount={(v)=>setDeveloperTuning((c)=>({...c, temporal:{...c.temporal, operationSmoothingAlpha:v, landmarkSmoothingAlpha:v}}))} developerTuning={developerTuning} setDeveloperTuning={setDeveloperTuning} onResetDeveloperTuning={()=>setDeveloperTuning(DEFAULT_DEVELOPER_TUNING)} />
        <TimelinePanel clip={loadedAnimationClip} currentTime={animationTime} currentValues={timelineSnapshot.values} selectedTrackIndex={selectedTrackIndex} selectedKeyframeIndex={selectedKeyframeIndex} onSelectKeyframe={selectKeyframe} onSeek={(time) => {
          timelineRef.seek(time);
          syncTimelineSnapshot();
        }} onDragKeyframeTime={(trackIndex, keyframeIndex, time) => {
          updateSelectedAnimationClip((clip) => updateClipKeyframeTime(clip, trackIndex, keyframeIndex, time));
          timelineRef.seek(time);
          syncTimelineSnapshot();
        }} onInsertKeyframe={addKeyframeAtTime} onScrubStart={() => {
          timelineRef.setPlaying(false);
          syncTimelineSnapshot();
        }} />
        <ComparePanel capture={compareCapture} />
        <WarpMathDebugPanel debugUv={debugUv} debugCenter={debugCenter} debugWarpResult={{ warpedUv: debugWarpResult, influence: 0 }} debugGridPoints={debugGridPoints} onMouseMove={(event: MouseEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setDebugUv({ x: clamp01((event.clientX - rect.left) / Math.max(1, rect.width)), y: clamp01((event.clientY - rect.top) / Math.max(1, rect.height)) }); }} />
        <JsonOutputPanel preset={pipelineState.activePreset} geometry={runtime.state.faceGeometry} />
      </div>
    </main>
  );
}
