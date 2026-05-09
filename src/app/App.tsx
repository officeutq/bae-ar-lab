import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultWarpPreset } from '@algorithms/defaultPreset';
import { createCameraController, type CameraError } from '@engine/camera/createCameraController';
import { createInitialPipelineState } from '@engine/pipeline';
import {
  createCanvasRenderer,
  type CanvasRenderer,
  type CanvasRendererState,
} from '@engine/render/createCanvasRenderer';
import { Panel } from '@ui/Panel';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const [cameraState, setCameraState] = useState<CameraViewState>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [rendererState, setRendererState] = useState<CanvasRendererState>('idle');


  useEffect(() => {
    return () => {
      rendererRef.current?.stop();
      rendererRef.current = null;
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraState('starting');
    setCameraErrorMessage(null);

    try {
      const stream = await cameraController.start();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const videoElement = videoRef.current;
      const canvasElement = processedCanvasRef.current;

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

      setCameraState('running');
    } catch (error) {
      const cameraError = error as CameraError;
      setCameraState('error');
      setCameraErrorMessage(getCameraErrorMessage(cameraError));
    }
  };

  const handleStopCamera = () => {
    rendererRef.current?.stop();

    if (rendererRef.current) {
      setRendererState(rendererRef.current.getState());
    }

    cameraController.stop();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState('idle');
    setCameraErrorMessage(null);
  };

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">Beauty AR & Face Warp Lab</h1>
      <div className="panel-grid">
        <Panel title="Source Preview">
          <video className="source-video" ref={videoRef} autoPlay playsInline muted />
          <p className="camera-status">Camera state: {cameraState}</p>
          {cameraErrorMessage ? <p className="camera-error">{cameraErrorMessage}</p> : null}
        </Panel>

        <Panel title="Processed Preview">
          <canvas className="processed-canvas" ref={processedCanvasRef} />
          <p className="camera-status">Renderer state: {rendererState}</p>
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
          <ul>
            <li>Status: {pipelineState.status}</li>
            <li>Preset: {pipelineState.activePreset.name}</li>
            <li>Intensity: {pipelineState.activePreset.params.intensity}</li>
            <li>Smoothness: {pipelineState.activePreset.params.smoothness}</li>
            <li>Falloff: {pipelineState.activePreset.params.falloff}</li>
          </ul>
        </Panel>

        <Panel title="JSON Output">
          <pre>{JSON.stringify(pipelineState.activePreset, null, 2)}</pre>
        </Panel>
      </div>
    </main>
  );
}
