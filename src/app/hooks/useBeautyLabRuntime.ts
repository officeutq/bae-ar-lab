import { useEffect, useMemo, useRef, useState } from 'react';
import { createCameraController, type CameraError } from '@engine/camera/createCameraController';
import { computeFaceGeometry } from '@engine/geometry/computeFaceGeometry';
import type { FaceGeometry } from '@engine/geometry/types';
import { createFaceLandmarker } from '@engine/mediapipe/createFaceLandmarker';
import type { FaceLandmarksFrame, FaceLandmarkerRuntimeState } from '@engine/mediapipe/types';
import { createLandmarkOverlay, type LandmarkOverlay } from '@engine/overlay/createLandmarkOverlay';
import {
  createCanvasRenderer,
  type CanvasRenderer,
  type CanvasRendererState,
} from '@engine/render/createCanvasRenderer';
import { createWebglRenderer, type WebglRenderer } from '@engine/webgl/createWebglRenderer';
import type { WarpOperation } from '@app-types/preset';
import type { RendererMode } from '@engine/render/types';
import { resolveOperationBindings } from '@engine/algorithms/resolveOperationBindings';
import { createProfiler, type ProfilerSnapshot } from '@engine/profiler/createProfiler';
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

type PreviewRenderer = CanvasRenderer | WebglRenderer;

export function useBeautyLabRuntime(
  activeOperation: WarpOperation | null,
  operations: WarpOperation[],
  overlayToggles: OverlayToggles,
  rendererMode: RendererMode,
  skinSmoothing: { enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean },
  skinTone: { enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number },
  initialQuality: QualityLevel = 'high',
  adaptiveQualityEnabledByDefault = true,
) {
  const cameraController = useMemo(() => createCameraController(), []);
  const faceLandmarkerController = useMemo(() => createFaceLandmarker(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PreviewRenderer | null>(null);
  const overlayRef = useRef<LandmarkOverlay | null>(null);
  const detectAnimationRef = useRef<number | null>(null);
  const activeOperationRef = useRef<WarpOperation | null>(activeOperation);
  const faceGeometryRef = useRef<FaceGeometry | null>(null);
  const rendererModeRef = useRef<RendererMode>(rendererMode);
  const operationsRef = useRef<WarpOperation[]>(operations);
  const resolvedOperationsRef = useRef<WarpOperation[]>(operations);
  const resolvedActiveOperationRef = useRef<WarpOperation | null>(activeOperation);
  const profilerRef = useRef(createProfiler({ sampleWindow: 30 }));
  const detectFrameCountRef = useRef(0);
  const lastLandmarkFrameRef = useRef<FaceLandmarksFrame | null>(null);
  const adaptiveQualityControllerRef = useRef(createAdaptiveQualityController(initialQuality));
  const adaptiveQualityRef = useRef<AdaptiveQualityState>({ enabled: adaptiveQualityEnabledByDefault, selectedQuality: initialQuality, currentQuality: initialQuality });

  const [cameraState, setCameraState] = useState<CameraViewState>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [rendererState, setRendererState] = useState<CanvasRendererState>('idle');
  const [landmarkerState, setLandmarkerState] = useState<FaceLandmarkerRuntimeState>('idle');
  const [landmarkFrame, setLandmarkFrame] = useState<FaceLandmarksFrame | null>(null);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry | null>(null);
  const [profilerSnapshot, setProfilerSnapshot] = useState<ProfilerSnapshot>(profilerRef.current.getSnapshot());
  const [adaptiveQuality, setAdaptiveQuality] = useState<AdaptiveQualityState>(adaptiveQualityRef.current);

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
    if (cameraState !== 'running') {
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = processedCanvasRef.current;

    if (!videoElement || !canvasElement) {
      return;
    }

    rendererRef.current?.stop();
    const renderer = rendererMode === 'webgl'
      ? createWebglRenderer({
        video: videoElement,
        canvas: canvasElement,
        getOperations: () => resolvedOperationsRef.current,
        getFaceGeometry: () => faceGeometryRef.current,
        getSkinSmoothing: () => skinSmoothing,
        getSkinTone: () => skinTone,
        onRenderFrame: (renderTimeMs) => {
          setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
        },
        getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
        getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
        getSmoothingSampleCount: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].smoothingSampleCount,
      })
      : createCanvasRenderer({
        video: videoElement,
        canvas: canvasElement,
        getCpuWarpPreviewEnabled: () => rendererModeRef.current === 'cpu_warp_debug',
        getActiveOperation: () => resolvedActiveOperationRef.current,
        getFaceGeometry: () => faceGeometryRef.current,
        getOperations: () => resolvedOperationsRef.current,
        onRenderFrame: (renderTimeMs) => {
          setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
        },
        getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
        getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
      });
    renderer.start();
    rendererRef.current = renderer;
    setRendererState(renderer.getState());
  }, [cameraState, rendererMode, skinSmoothing, skinTone]);

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
      const mediapipeMs = shouldDetect ? performance.now() - detectStart : 0;
      if (shouldDetect) {
        lastLandmarkFrameRef.current = result;
      }
      setLandmarkerState(faceLandmarkerController.getState());
      setLandmarkFrame(result);
      const nextGeometry = result.detected ? computeFaceGeometry({ landmarks: result.landmarks }) : null;
      setFaceGeometry(nextGeometry);
      faceGeometryRef.current = nextGeometry;
      const resolvedOperations = resolveOperationBindings(operationsRef.current, nextGeometry);
      resolvedOperationsRef.current = resolvedOperations;
      const activeIndex = operationsRef.current.findIndex((op) => op.id === activeOperationRef.current?.id);
      resolvedActiveOperationRef.current = activeIndex >= 0 ? resolvedOperations[activeIndex] : null;
      overlayRef.current?.render(result.landmarks, nextGeometry, resolvedActiveOperationRef.current);
      profilerRef.current.setBackend(rendererModeRef.current);
      profilerRef.current.setOperationCount(resolvedOperations.filter((operation) => operation.enabled).length);
      const nextSnapshot = profilerRef.current.commitFrame();
      const adaptiveRef = adaptiveQualityRef.current;
      if (adaptiveRef.enabled) {
        const decision = adaptiveQualityControllerRef.current.evaluate(nextSnapshot.avgFps30, nextSnapshot.timestamp);
        if (decision.changed) {
          adaptiveQualityRef.current = { ...adaptiveRef, currentQuality: decision.nextQuality };
          setAdaptiveQuality(adaptiveQualityRef.current);
        }
      }
      setProfilerSnapshot({ ...nextSnapshot, mediapipeMs });

      detectAnimationRef.current = requestAnimationFrame(tick);
    };

    detectAnimationRef.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    setCameraState('starting');
    setCameraErrorMessage(null);
    setLandmarkFrame(null);
    setFaceGeometry(null);
    faceGeometryRef.current = null;

    try {
      setLandmarkerState('loading');
      await faceLandmarkerController.initialize();
      setLandmarkerState(faceLandmarkerController.getState());

      const stream = await cameraController.start();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const videoElement = videoRef.current;
      const canvasElement = processedCanvasRef.current;
      const overlayCanvasElement = overlayCanvasRef.current;

      if (videoElement && canvasElement) {
        rendererRef.current?.stop();
        const renderer = rendererModeRef.current === 'webgl'
          ? createWebglRenderer({
            video: videoElement,
            canvas: canvasElement,
            getOperations: () => resolvedOperationsRef.current,
            getFaceGeometry: () => faceGeometryRef.current,
            getSkinSmoothing: () => skinSmoothing,
            getSkinTone: () => skinTone,
            onRenderFrame: (renderTimeMs) => {
              setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
            },
            getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
            getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
            getSmoothingSampleCount: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].smoothingSampleCount,
          })
          : createCanvasRenderer({
            video: videoElement,
            canvas: canvasElement,
            getCpuWarpPreviewEnabled: () => rendererModeRef.current === 'cpu_warp_debug',
            getActiveOperation: () => resolvedActiveOperationRef.current,
            getFaceGeometry: () => faceGeometryRef.current,
            getOperations: () => resolvedOperationsRef.current,
            onRenderFrame: (renderTimeMs) => {
              setProfilerSnapshot((current) => ({ ...current, renderMs: renderTimeMs }));
            },
            getRenderScale: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].renderScale,
            getFrameSkip: () => QUALITY_PRESETS[resolveRuntimeQuality(adaptiveQualityRef.current)].frameSkip,
          });
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
    setLandmarkFrame(null);
    setFaceGeometry(null);
    faceGeometryRef.current = null;
    setCameraState('idle');
    setCameraErrorMessage(null);
    profilerRef.current.reset();
  };

  return {
    refs: { videoRef, overlayCanvasRef, processedCanvasRef },
    state: { cameraState, cameraErrorMessage, rendererState, landmarkerState, landmarkFrame, faceGeometry },
    profiler: profilerSnapshot,
    quality: {
      adaptiveQuality,
      runtimeQuality,
      runtimePreset,
      setAdaptiveEnabled: (enabled: boolean) => {
        adaptiveQualityRef.current = { ...adaptiveQualityRef.current, enabled };
        setAdaptiveQuality(adaptiveQualityRef.current);
      },
      setSelectedQuality: (selectedQuality: QualityLevel) => {
        adaptiveQualityControllerRef.current.setQuality(selectedQuality);
        adaptiveQualityRef.current = { ...adaptiveQualityRef.current, selectedQuality, currentQuality: selectedQuality };
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
