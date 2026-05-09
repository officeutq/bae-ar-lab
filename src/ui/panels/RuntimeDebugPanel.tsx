import type { RendererMode } from '@engine/render/types';
import type { FacePose } from '@engine/geometry/types';
import type { FaceStabilitySnapshot } from '@engine/temporal/createFaceStabilityController';
import type { QualityLevel } from '@engine/performance/adaptiveQuality';
import { Panel } from '@ui/Panel';

type Props = {
  temporalSmoothingEnabled: boolean;
  temporalSmoothingAlpha: number;
  faceStability: FaceStabilitySnapshot;
  facePose: FacePose | null;
  poseAttenuationFactor: number;
  currentQuality: QualityLevel;
  renderScale: number;
  rendererMode: RendererMode;
  fps: number;
};

export function RuntimeDebugPanel({
  temporalSmoothingEnabled,
  temporalSmoothingAlpha,
  faceStability,
  facePose,
  poseAttenuationFactor,
  currentQuality,
  renderScale,
  rendererMode,
  fps,
}: Props) {
  return (
    <Panel title="Runtime Debug">
      <h4>Temporal</h4>
      <ul>
        <li>smoothing enabled: {temporalSmoothingEnabled ? 'true' : 'false'}</li>
        <li>smoothing alpha: {temporalSmoothingAlpha.toFixed(2)}</li>
      </ul>

      <h4>Face Stability</h4>
      <ul>
        <li>state: {faceStability.status}</li>
        <li>confidence: {faceStability.confidence.toFixed(2)}</li>
        <li>fade: {faceStability.fade.toFixed(2)}</li>
      </ul>

      <h4>Pose</h4>
      <ul>
        <li>yaw: {facePose?.yaw.toFixed(1) ?? 'n/a'}</li>
        <li>pitch: {facePose?.pitch.toFixed(1) ?? 'n/a'}</li>
        <li>roll: {facePose?.roll.toFixed(1) ?? 'n/a'}</li>
        <li>attenuation factor: {poseAttenuationFactor.toFixed(2)}</li>
      </ul>

      <h4>Quality</h4>
      <ul>
        <li>current quality: {currentQuality}</li>
        <li>render scale: {renderScale.toFixed(2)}</li>
        <li>renderer backend: {rendererMode}</li>
        <li>FPS: {fps.toFixed(1)}</li>
      </ul>
    </Panel>
  );
}
