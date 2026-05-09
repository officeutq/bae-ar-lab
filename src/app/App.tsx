import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultWarpPreset } from '@algorithms/defaultPreset';
import { createCameraController, type CameraError } from '@engine/camera/createCameraController';
import { createFaceLandmarker } from '@engine/mediapipe/createFaceLandmarker';
import type { FaceLandmarksFrame, FaceLandmarkerRuntimeState } from '@engine/mediapipe/types';
import { createLandmarkOverlay, type LandmarkOverlay } from '@engine/overlay/createLandmarkOverlay';
import { createInitialPipelineState } from '@engine/pipeline';
import {
  createCanvasRenderer,
  type CanvasRenderer,
  type CanvasRendererState,
} from '@engine/render/createCanvasRenderer';
import { Panel } from '@ui/Panel';
import { computeFaceGeometry } from '@engine/geometry/computeFaceGeometry';
import type { FaceGeometry } from '@engine/geometry/types';

type CameraViewState = 'idle' | 'starting' | 'running' | 'error';

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

export function App() {
  const pipelineState = useMemo(() => createInitialPipelineState(defaultWarpPreset), []);
  const cameraController = useMemo(() => createCameraController(), []);
  const faceLandmarkerController = useMemo(() => createFaceLandmarker(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const overlayRef = useRef<LandmarkOverlay | null>(null);
  const detectAnimationRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<CameraViewState>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [rendererState, setRendererState] = useState<CanvasRendererState>('idle');
  const [landmarkerState, setLandmarkerState] = useState<FaceLandmarkerRuntimeState>('idle');
  const [landmarkFrame, setLandmarkFrame] = useState<FaceLandmarksFrame | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry | null>(null);

  useEffect(() => {
    return () => {
      if (detectAnimationRef.current !== null) {
        cancelAnimationFrame(detectAnimationRef.current);
      }
      rendererRef.current?.stop();
      rendererRef.current = null;
      overlayRef.current?.clear();
      overlayRef.current = null;
      faceLandmarkerController.dispose();
    };
  }, [faceLandmarkerController]);

  useEffect(() => {
    overlayRef.current?.updateToggles({ showLandmarks, showCenters });
  }, [showCenters, showLandmarks]);

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
      setFaceGeometry(result.detected ? computeFaceGeometry({ landmarks: result.landmarks }) : null);
      overlayRef.current?.render(result.landmarks);

      detectAnimationRef.current = requestAnimationFrame(tick);
    };

    detectAnimationRef.current = requestAnimationFrame(tick);
  };

  const handleStartCamera = async () => {
    setCameraState('starting');
    setCameraErrorMessage(null);
    setLandmarkFrame(null);
    setFaceGeometry(null);

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

        const renderer = createCanvasRenderer({
          video: videoElement,
          canvas: canvasElement,
        });

        renderer.start();
        rendererRef.current = renderer;
        setRendererState(renderer.getState());
      }

      if (overlayCanvasElement) {
        overlayRef.current = createLandmarkOverlay(overlayCanvasElement);
        overlayRef.current.updateToggles({ showLandmarks, showCenters });
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

  const handleStopCamera = () => {
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
    setCameraState('idle');
    setCameraErrorMessage(null);
  };

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">Beauty AR & Face Warp Lab</h1>
      <div className="panel-grid">
        <Panel title="Source Preview">
          <div className="source-preview">
            <video className="source-video" ref={videoRef} autoPlay playsInline muted />
            <canvas className="overlay-canvas" ref={overlayCanvasRef} />
          </div>
          <p className="camera-status">Camera state: {cameraState}</p>
          <p className="camera-status">Landmarker state: {landmarkerState}</p>
          {cameraErrorMessage ? <p className="camera-error">{cameraErrorMessage}</p> : null}
        </Panel>

        <Panel title="Processed Preview">
          <canvas className="processed-canvas" ref={processedCanvasRef} />
          <p className="camera-status">Renderer state: {rendererState}</p>
        </Panel>

        <Panel title="Face Detection Status">
          <ul>
            <li>Face: {landmarkFrame?.detected ? 'detected' : 'not detected'}</li>
            <li>Landmark count: {landmarkFrame?.landmarkCount ?? 0}</li>
            <li>Face count: {landmarkFrame?.faceCount ?? 0}</li>
            <li>Frame: {landmarkFrame?.frameCount ?? 0}</li>
            <li>Timestamp (ms): {Math.round(landmarkFrame?.timestampMs ?? 0)}</li>
          </ul>
        </Panel>

        <Panel title="Control Panel">
          <div className="camera-controls">
            <button type="button" onClick={handleStartCamera} disabled={cameraState === 'starting'}>
              Start Camera
            </button>
            <button type="button" onClick={handleStopCamera} disabled={cameraState !== 'running'}>
              Stop Camera
            </button>
          </div>
          <div className="overlay-controls">
            <label>
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(event) => setShowLandmarks(event.target.checked)}
              />
              Show landmarks
            </label>
            <label>
              <input
                type="checkbox"
                checked={showCenters}
                onChange={(event) => setShowCenters(event.target.checked)}
              />
              Show centers
            </label>
          </div>
          <ul>
            <li>Status: {pipelineState.status}</li>
            <li>Preset: {pipelineState.activePreset.name}</li>
            <li>Intensity: {pipelineState.activePreset.params.intensity}</li>
            <li>Smoothness: {pipelineState.activePreset.params.smoothness}</li>
            <li>Falloff: {pipelineState.activePreset.params.falloff}</li>
          </ul>
        </Panel>

        <Panel title="JSON Output">
          <pre>{JSON.stringify({ preset: pipelineState.activePreset, geometry: faceGeometry }, null, 2)}</pre>
        </Panel>
      </div>
    </main>
  );
}
