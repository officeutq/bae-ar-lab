import { useEffect, useMemo, useRef, useState } from 'react';
import { createCameraController, type CameraError } from '@engine/camera/createCameraController';
import { computeFaceGeometry } from '@engine/geometry/computeFaceGeometry';
import { computeFacePose, computePoseAttenuation } from '@engine/geometry/computeFacePose';
import type { FaceGeometry } from '@engine/geometry/types';
import type { FacePose, PoseAttenuation } from '@engine/geometry/types';
import { createFaceLandmarker } from '@engine/mediapipe/createFaceLandmarker';
import type { FaceLandmarksFrame, FaceLandmarkerRuntimeState } from '@engine/mediapipe/types';
import { createLandmarkOverlay, type LandmarkOverlay } from '@engine/overlay/createLandmarkOverlay';
import { createRendererBackend } from '@engine/render/createRendererBackend';
import { replaceRendererBackend } from '@engine/render/replaceRendererBackend';
import type { WarpOperation } from '@app-types/preset';
import type { RendererBackend, RendererBackendMode, RendererBackendState } from '@engine/render/types';
import { resolveOperationBindings } from '@engine/algorithms/resolveOperationBindings';
import { createProfiler, type ProfilerSnapshot } from '@engine/profiler/createProfiler';
import { createTemporalFilter } from '@engine/temporal/createTemporalFilter';
import { smoothLandmarks } from '@engine/temporal/smoothLandmarks';
import { smoothOperations } from '@engine/temporal/smoothOperations';
import { createFaceStabilityController, type FaceStabilitySnapshot } from '@engine/temporal/createFaceStabilityController';
import {
  createAdaptiveQualityController,
  QUALITY_PRESETS,
  resolveRuntimeQuality,
  type AdaptiveQualityState,
  type QualityLevel,
} from '@engine/performance/adaptiveQuality';

type CameraViewState = 'idle' | 'starting' | 'running' | 'error';

type OverlayToggles = {
  showLandmarks: boolean;
  showCenters: boolean;
  showWarpInfluence: boolean;
  showWarpCenter: boolean;
  showFalloffRings: boolean;
};

function getCameraErrorMessage(error: CameraError) {
  switch (error.code) {
    case 'permission-denied':
      return 'Permission denied: allow camera access in your browser settings.';
    case 'no-camera-found':
      return 'No camera found: connect a camera and try again.';
    case 'unsupported-browser':
      return 'Unsupported browser: MediaDevices.getUserMedia is not available.';
    default:
      return error.message;
  }
}


export function useBeautyLabRuntime(
  activeOperation: WarpOperation | null,
  operations: WarpOperation[],
  overlayToggles: OverlayToggles,
  rendererMode: RendererBackendMode,
  skinSmoothing: { enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean },
  skinTone: { enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number },
  temporalSmoothing: { enabled: boolean; alpha: number },
  initialQuality: QualityLevel = 'high',
  adaptiveQualityEnabledByDefault = true,
) {
  const cameraController = useMemo(() => createCameraController(), []);
  const faceLandmarkerController = useMemo(() => createFaceLandmarker(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const beautyDebugOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RendererBackend | null>(null);
  const overlayRef = useRef<LandmarkOverlay | null>(null);
  const detectAnimationRef = useRef<number | null>(null);
  const activeOperationRef = useRef<WarpOperation | null>(activeOperation);
  const faceGeometryRef = useRef<FaceGeometry | null>(null);
  const rendererModeRef = useRef<RendererBackendMode>(rendererMode);
  const operationsRef = useRef<WarpOperation[]>(operations);
  const resolvedOperationsRef = useRef<WarpOperation[]>(operations);
  const resolvedActiveOperationRef = useRef<WarpOperation | null>(activeOperation);
  const profilerRef = useRef(createProfiler({ sampleWindow: 30 }));
  const detectFrameCountRef = useRef(0);
  const lastLandmarkFrameRef = useRef<FaceLandmarksFrame | null>(null);
  const adaptiveQualityControllerRef = useRef(createAdaptiveQualityController(initialQuality));
  const landmarkTemporalFilterRef = useRef(createTemporalFilter());
  const operationTemporalFilterRef = useRef(createTemporalFilter());
  const adaptiveQualityRef = useRef<AdaptiveQualityState>({ enabled: adaptiveQualityEnabledByDefault, selectedQuality: initialQuality, currentQuality: initialQuality, reason: 'manual' });
  const faceStabilityRef = useRef(createFaceStabilityController());
  const lastStableGeometryRef = useRef<FaceGeometry | null>(null);
  const skinSmoothingRef = useRef(skinSmoothing);
  const skinToneRef = useRef(skinTone);

  const [cameraState, setCameraState] = useState<CameraViewState>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [rendererState, setRendererState] = useState<RendererBackendState>('idle');
  const [landmarkerState, setLandmarkerState] = useState<FaceLandmarkerRuntimeState>('idle');
  const [landmarkFrame, setLandmarkFrame] = useState<FaceLandmarksFrame | null>(null);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry | null>(null);
  const [profilerSnapshot, setProfilerSnapshot] = useState<ProfilerSnapshot>(profilerRef.current.getSnapshot());
  const [facePose, setFacePose] = useState<FacePose | null>(null);
  const [poseAttenuation, setPoseAttenuation] = useState<PoseAttenuation>({ factor: 1, yawFactor: 1, pitchFactor: 1 });
  const [adaptiveQuality, setAdaptiveQuality] = useState<AdaptiveQualityState>(adaptiveQualityRef.current);
  const [faceStability, setFaceStability] = useState<FaceStabilitySnapshot>(faceStabilityRef.current.getSnapshot());
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number }>({ width: 16, height: 9 });

  const runtimeQuality = resolveRuntimeQuality(adaptiveQualityRef.current);
  const runtimePreset = QUALITY_PRESETS[runtimeQuality];

  useEffect(() => {
    activeOperationRef.current = activeOperation;
  }, [activeOperation]);

  useEffect(() => {
    rendererModeRef.current = rendererMode;
  }, [rendererMode]);

  useEffect(() => {
    operationsRef.current = operations;
    resolvedOperationsRef.current = operations;
    const activeIndex = operations.findIndex((op) => op.id === activeOperationRef.current?.id);
    resolvedActiveOperationRef.current = activeIndex >= 0 ? operations[activeIndex] : null;
  }, [operations]);

  useEffect(() => {
    overlayRef.current?.updateToggles(overlayToggles);
  }, [overlayToggles]);

  useEffect(() => {
    skinSmoothingRef.current = skinSmoothing;
  }, [skinSmoothing]);

  useEffect(() => {
    skinToneRef.current = skinTone;
  }, [skinTone]);

  useEffect(() => {
    if (cameraState !== 'running') {
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = rendererMode === 'webgl' ? webglCanvasRef.current : canvas2dRef.current;

    if (!videoElement || !canvasElement) {
      return;
    }

    const renderer = replaceRendererBackend(rendererRef.current, () => createRendererBackend({
      mode: rendererMode,
      video: videoElement,
      canvas2d: canvas2dRef.current!,
      webgl: webglCanvasRef.current!,
      getOperations: () => resolvedOperationsRef.current,
      getActiveOperation: () => resolvedActiveOperationRef.current,
      getFaceGeometry: () => faceGeometryRef.current,
      getSkinSmoothing: () => ({ ...skinSmoothingRef.current, strength: skinSmoothingRef.current.strength * faceStabilityRef.current.getSnapshot().fade }),
      getSkinTone: () => ({ ...skinToneRef.current, blend: skinToneRef.current.blend * faceStabilityRef.current.getSnapshot().fade }),
      onRenderFrame: (renderTimeMs) => {
        setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
      },
      getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
      getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
      getSmoothingSampleCount: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].smoothingSampleCount,
    }));
    renderer.start();
    rendererRef.current = renderer;
    setRendererState(renderer.getState());
  }, [cameraState, rendererMode]);

  useEffect(() => () => {
    if (detectAnimationRef.current !== null) {
      cancelAnimationFrame(detectAnimationRef.current);
    }
    rendererRef.current?.stop();
    overlayRef.current?.clear();
    faceLandmarkerController.dispose();
    cameraController.stop();
  }, [cameraController, faceLandmarkerController]);

  const startFaceLandmarkLoop = () => {
    const tick = () => {
      const videoElement = videoRef.current;
      if (!videoElement || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        detectAnimationRef.current = requestAnimationFrame(tick);
        return;
      }

      const preset = QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)];
      const shouldDetect = preset.mediapipeIntervalFrames <= 1
        || detectFrameCountRef.current % preset.mediapipeIntervalFrames === 0;
      detectFrameCountRef.current += 1;
      const detectStart = performance.now();
      const result = shouldDetect
        ? faceLandmarkerController.detectForVideoFrame(videoElement, performance.now())
        : (lastLandmarkFrameRef.current ?? { detected: false, landmarks: [], frameCount: 0, timestampMs: performance.now(), faceCount: 0, landmarkCount: 0 });
      const smoothedLandmarks = temporalSmoothing.enabled && result.detected
        ? smoothLandmarks(result.landmarks, landmarkTemporalFilterRef.current, temporalSmoothing.alpha)
        : result.landmarks;
      const runtimeFrame = { ...result, landmarks: smoothedLandmarks };
      const mediapipeMs = shouldDetect ? performance.now() - detectStart : 0;
      if (shouldDetect) {
        lastLandmarkFrameRef.current = runtimeFrame;
      }
      setLandmarkerState(faceLandmarkerController.getState());
      setLandmarkFrame(runtimeFrame);

      const stability = faceStabilityRef.current.update(runtimeFrame.detected);
      setFaceStability(stability);
      const detectedGeometry = runtimeFrame.detected ? computeFaceGeometry({ landmarks: runtimeFrame.landmarks }) : null;
      const detectedPose = runtimeFrame.detected ? computeFacePose(runtimeFrame.landmarks) : null;
      const runtimePose = detectedPose ?? (stability.fade > 0 ? facePose : null);
      const runtimeAttenuation = computePoseAttenuation(runtimePose);
      setFacePose(runtimePose);
      setPoseAttenuation(runtimeAttenuation);
      if (detectedGeometry) {
        lastStableGeometryRef.current = detectedGeometry;
      }
      const geometryForRuntime = detectedGeometry ?? (stability.fade > 0 ? lastStableGeometryRef.current : null);
      setFaceGeometry(geometryForRuntime);
      faceGeometryRef.current = geometryForRuntime;
      const runtimeQualityLevel = resolveRuntimeQuality(adaptiveQualityRef.current);
      const runtimeQualityPreset = QUALITY_PRESETS[runtimeQualityLevel];
      const boundOperations = resolveOperationBindings(operationsRef.current, geometryForRuntime)
        .filter((operation) => !runtimeQualityPreset.disabledTargets.includes(operation.target))
        .map((operation) => ({
          ...operation,
          strength: operation.strength * runtimeQualityPreset.warpStrengthScale * stability.fade * runtimeAttenuation.factor,
        }));
      const cappedOperations = runtimeQualityPreset.maxActiveOperations === null
        ? boundOperations
        : boundOperations.map((operation, index) => ({ ...operation, enabled: operation.enabled && index < (runtimeQualityPreset.maxActiveOperations ?? Number.POSITIVE_INFINITY) }));
      const resolvedOperations = temporalSmoothing.enabled
        ? smoothOperations(cappedOperations, operationTemporalFilterRef.current, temporalSmoothing.alpha)
        : cappedOperations;
      resolvedOperationsRef.current = resolvedOperations;
      const activeIndex = operationsRef.current.findIndex((op) => op.id === activeOperationRef.current?.id);
      resolvedActiveOperationRef.current = activeIndex >= 0 ? resolvedOperations[activeIndex] : null;
      overlayRef.current?.render(runtimeFrame.landmarks, geometryForRuntime, resolvedActiveOperationRef.current);
      profilerRef.current.setBackend(rendererModeRef.current);
      profilerRef.current.setOperationCount(resolvedOperations.filter((operation) => operation.enabled).length);
      const nextSnapshot = profilerRef.current.commitFrame();
      const adaptiveRef = adaptiveQualityRef.current;
      if (adaptiveRef.enabled) {
        const decision = adaptiveQualityControllerRef.current.evaluate(nextSnapshot.avgFps30, nextSnapshot.timestamp);
        if (decision.changed) {
          adaptiveQualityRef.current = { ...adaptiveRef, currentQuality: decision.nextQuality, reason: decision.reason };
          setAdaptiveQuality(adaptiveQualityRef.current);
        }
      }
      setProfilerSnapshot({ ...nextSnapshot, mediapipeMs });

      detectAnimationRef.current = requestAnimationFrame(tick);
    };

    detectAnimationRef.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    if (detectAnimationRef.current !== null) {
      cancelAnimationFrame(detectAnimationRef.current);
      detectAnimationRef.current = null;
    }
    rendererRef.current?.stop();
    setCameraState('starting');
    setCameraErrorMessage(null);
    landmarkTemporalFilterRef.current.reset();
    operationTemporalFilterRef.current.reset();
    setLandmarkFrame(null);
    setFaceGeometry(null);
    setFacePose(null);
    setPoseAttenuation({ factor: 1, yawFactor: 1, pitchFactor: 1 });
    faceGeometryRef.current = null;
    lastStableGeometryRef.current = null;
    faceStabilityRef.current.reset();
    setFaceStability(faceStabilityRef.current.getSnapshot());

    try {
      setLandmarkerState('loading');
      await faceLandmarkerController.initialize();
      setLandmarkerState(faceLandmarkerController.getState());

      const stream = await cameraController.start();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        if (width > 0 && height > 0) {
          setPreviewSize({ width, height });
        }
      }

      const videoElement = videoRef.current;
      const canvasElement = rendererModeRef.current === 'webgl' ? webglCanvasRef.current : canvas2dRef.current;
      const overlayCanvasElement = overlayCanvasRef.current;

      if (videoElement && canvasElement) {
        const renderer = replaceRendererBackend(rendererRef.current, () => createRendererBackend({
          mode: rendererModeRef.current,
          video: videoElement,
          canvas2d: canvas2dRef.current!,
          webgl: webglCanvasRef.current!,
          getOperations: () => resolvedOperationsRef.current,
          getActiveOperation: () => resolvedActiveOperationRef.current,
          getFaceGeometry: () => faceGeometryRef.current,
          getSkinSmoothing: () => ({ ...skinSmoothingRef.current, strength: skinSmoothingRef.current.strength * faceStabilityRef.current.getSnapshot().fade }),
          getSkinTone: () => ({ ...skinToneRef.current, blend: skinToneRef.current.blend * faceStabilityRef.current.getSnapshot().fade }),
          onRenderFrame: (renderTimeMs) => {
            setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
          },
          getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
          getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
          getSmoothingSampleCount: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].smoothingSampleCount,
        }));
        renderer.start();
        rendererRef.current = renderer;
        setRendererState(renderer.getState());
      }

      if (overlayCanvasElement) {
        overlayRef.current = createLandmarkOverlay(overlayCanvasElement);
        overlayRef.current.updateToggles(overlayToggles);
        overlayRef.current.syncSize();
      }

      startFaceLandmarkLoop();
      setCameraState('running');
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Failed to start camera.';
      const cameraError = error as CameraError;
      setCameraState('error');
      setCameraErrorMessage(cameraError?.code ? getCameraErrorMessage(cameraError) : fallbackMessage);
      setLandmarkerState('error');
    }
  };

  const stopCamera = () => {
    if (detectAnimationRef.current !== null) {
      cancelAnimationFrame(detectAnimationRef.current);
      detectAnimationRef.current = null;
    }
    rendererRef.current?.stop();
    if (rendererRef.current) {
      setRendererState(rendererRef.current.getState());
    }
    cameraController.stop();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    overlayRef.current?.clear();
    faceLandmarkerController.dispose();
    setLandmarkerState(faceLandmarkerController.getState());
    landmarkTemporalFilterRef.current.reset();
    operationTemporalFilterRef.current.reset();
    setLandmarkFrame(null);
    setFaceGeometry(null);
    setFacePose(null);
    setPoseAttenuation({ factor: 1, yawFactor: 1, pitchFactor: 1 });
    faceGeometryRef.current = null;
    lastStableGeometryRef.current = null;
    faceStabilityRef.current.reset();
    setFaceStability(faceStabilityRef.current.getSnapshot());
    setCameraState('idle');
    setPreviewSize({ width: 16, height: 9 });
    setCameraErrorMessage(null);
    profilerRef.current.reset();
  };

  return {
    refs: { videoRef, overlayCanvasRef, canvas2dRef, webglCanvasRef, beautyDebugOverlayCanvasRef },
    state: { cameraState, cameraErrorMessage, rendererState, landmarkerState, landmarkFrame, faceGeometry, previewSize },
    pose: { facePose, poseAttenuation },
    profiler: profilerSnapshot,
    faceStability,
    quality: {
      adaptiveQuality,
      runtimeQuality,
      runtimePreset,
      setAdaptiveEnabled: (enabled: boolean) => {
        adaptiveQualityRef.current = { ...adaptiveQualityRef.current, enabled, reason: 'manual' };
        setAdaptiveQuality(adaptiveQualityRef.current);
      },
      setSelectedQuality: (selectedQuality: QualityLevel) => {
        adaptiveQualityControllerRef.current.setQuality(selectedQuality);
        adaptiveQualityRef.current = { ...adaptiveQualityRef.current, selectedQuality, currentQuality: selectedQuality, reason: 'manual' };
        setAdaptiveQuality(adaptiveQualityRef.current);
      },
    },
    actions: { startCamera, stopCamera },
    resolved: {
      getOperations: () => resolvedOperationsRef.current,
      getActiveOperation: () => resolvedActiveOperationRef.current,
    },
  };
}
