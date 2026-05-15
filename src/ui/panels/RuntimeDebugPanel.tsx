import type { RendererMode } from '@engine/render/types';
import type { FacePose } from '@engine/geometry/types';
import type { FaceStabilitySnapshot } from '@engine/temporal/createFaceStabilityController';
import type { AdaptiveQualityReason, QualityLevel } from '@engine/performance/adaptiveQuality';
import { Panel } from '@ui/Panel';

type Props = {
  temporalSmoothingEnabled: boolean;
  temporalSmoothingAlpha: number;
  faceDetected: boolean;
  faceStability: FaceStabilitySnapshot;
  facePose: FacePose | null;
  poseAttenuationFactor: number;
  poseAttenuationYawFactor: number;
  poseAttenuationPitchFactor: number;
  activeOperationCount: number;
  frameSkip: number;
  currentQuality: QualityLevel;
  selectedQuality: QualityLevel;
  adaptiveQualityEnabled: boolean;
  adaptiveQualityReason: AdaptiveQualityReason;
  qualityLockRemainingMs: number;
  renderScale: number;
  rendererMode: RendererMode;
  fps: number;
  frameTimeMs: number;
  mediapipeTimeMs: number;
  rendererTimeMs: number;
};

export function RuntimeDebugPanel({
  temporalSmoothingEnabled,
  temporalSmoothingAlpha,
  faceDetected,
  faceStability,
  facePose,
  poseAttenuationFactor,
  poseAttenuationYawFactor,
  poseAttenuationPitchFactor,
  activeOperationCount,
  frameSkip,
  currentQuality,
  selectedQuality,
  adaptiveQualityEnabled,
  adaptiveQualityReason,
  qualityLockRemainingMs,
  renderScale,
  rendererMode,
  fps,
  frameTimeMs,
  mediapipeTimeMs,
  rendererTimeMs,
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
        <li>detected: {faceDetected ? 'yes' : 'no'}</li>
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
        <li>yaw attenuation: {poseAttenuationYawFactor.toFixed(2)}</li>
        <li>pitch attenuation: {poseAttenuationPitchFactor.toFixed(2)}</li>
      </ul>

      <h4>Quality</h4>
      <ul>
        <li>adaptive quality: {adaptiveQualityEnabled ? 'enabled' : 'disabled'}</li>
        <li>adaptive active: {adaptiveQualityEnabled ? 'true' : 'false'}</li>
        <li>quality reason: {adaptiveQualityReason}</li>
        <li>quality lock remaining: {(qualityLockRemainingMs / 1000).toFixed(1)}s</li>
        <li>selected quality: {selectedQuality}</li>
        <li>current quality: {currentQuality}</li>
        <li>render scale: {renderScale.toFixed(2)}</li>
        <li>frame skip: {frameSkip}</li>
        <li>renderer backend: {rendererMode}</li>
        <li>active operations: {activeOperationCount}</li>
        <li>FPS: {fps.toFixed(1)}</li>
        <li>frame time: {frameTimeMs.toFixed(2)} ms</li>
        <li>MediaPipe time: {mediapipeTimeMs.toFixed(2)} ms</li>
        <li>renderer time: {rendererTimeMs.toFixed(2)} ms</li>
      </ul>
    </Panel>
  );
}
