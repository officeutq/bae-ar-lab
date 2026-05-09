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

export function useBeautyLabRuntime(activeOperation: WarpOperation | null, overlayToggles: OverlayToggles, enableCpuWarpPreview: boolean, enableWebglRenderer: boolean) {
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
  const cpuWarpPreviewEnabledRef = useRef(enableCpuWarpPreview);
  const webglRendererEnabledRef = useRef(enableWebglRenderer);

  const [cameraState, setCameraState] = useState<CameraViewState>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [rendererState, setRendererState] = useState<CanvasRendererState>('idle');
  const [landmarkerState, setLandmarkerState] = useState<FaceLandmarkerRuntimeState>('idle');
  const [landmarkFrame, setLandmarkFrame] = useState<FaceLandmarksFrame | null>(null);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry | null>(null);

  useEffect(() => {
    activeOperationRef.current = activeOperation;
  }, [activeOperation]);

  useEffect(() => {
    cpuWarpPreviewEnabledRef.current = enableCpuWarpPreview;
  }, [enableCpuWarpPreview]);

  useEffect(() => {
    webglRendererEnabledRef.current = enableWebglRenderer;
  }, [enableWebglRenderer]);

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
    const renderer = enableWebglRenderer
      ? createWebglRenderer({ video: videoElement, canvas: canvasElement })
      : createCanvasRenderer({
        video: videoElement,
        canvas: canvasElement,
        getCpuWarpPreviewEnabled: () => cpuWarpPreviewEnabledRef.current,
        getActiveOperation: () => activeOperationRef.current,
        getFaceGeometry: () => faceGeometryRef.current,
      });
    renderer.start();
    rendererRef.current = renderer;
    setRendererState(renderer.getState());
  }, [cameraState, enableWebglRenderer]);

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

      const result = faceLandmarkerController.detectForVideoFrame(videoElement, performance.now());
      setLandmarkerState(faceLandmarkerController.getState());
      setLandmarkFrame(result);
      const nextGeometry = result.detected ? computeFaceGeometry({ landmarks: result.landmarks }) : null;
      setFaceGeometry(nextGeometry);
      faceGeometryRef.current = nextGeometry;
      overlayRef.current?.render(result.landmarks, nextGeometry, activeOperationRef.current);

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
        const renderer = webglRendererEnabledRef.current
          ? createWebglRenderer({ video: videoElement, canvas: canvasElement })
          : createCanvasRenderer({
            video: videoElement,
            canvas: canvasElement,
            getCpuWarpPreviewEnabled: () => cpuWarpPreviewEnabledRef.current,
            getActiveOperation: () => activeOperationRef.current,
            getFaceGeometry: () => faceGeometryRef.current,
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
  };

  return {
    refs: { videoRef, overlayCanvasRef, processedCanvasRef },
    state: { cameraState, cameraErrorMessage, rendererState, landmarkerState, landmarkFrame, faceGeometry },
    actions: { startCamera, stopCamera },
  };
}
