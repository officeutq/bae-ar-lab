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
  resolvedOperationCount: number;
  filteredOperationCount: number;
  warpStrengthScale: number;
  firstActiveOperationSummary: string;
  beautyIntensity: number;
  animatedBeautyIntensity: number;
  rawOperationStrengthSummary: string[];
  intensityOperationStrengthSummary: string[];
  resolvedOperationStrengthSummary: string[];
  effectiveMultiplierSummary: string[];
  frameSkip: number;
  currentQuality: QualityLevel;
  selectedQuality: QualityLevel;
  adaptiveQualityEnabled: boolean;
  adaptiveQualityReason: AdaptiveQualityReason;
  qualityLockRemainingMs: number;
  qualityRecoveryElapsedMs: number;
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
  resolvedOperationCount,
  filteredOperationCount,
  warpStrengthScale,
  firstActiveOperationSummary,
  beautyIntensity,
  animatedBeautyIntensity,
  rawOperationStrengthSummary,
  intensityOperationStrengthSummary,
  resolvedOperationStrengthSummary,
  effectiveMultiplierSummary,
  frameSkip,
  currentQuality,
  selectedQuality,
  adaptiveQualityEnabled,
  adaptiveQualityReason,
  qualityLockRemainingMs,
  qualityRecoveryElapsedMs,
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
        <li>recovery timer: {(qualityRecoveryElapsedMs / 1000).toFixed(1)}s</li>
        <li>selected quality: {selectedQuality}</li>
        <li>current quality: {currentQuality}</li>
        <li>render scale: {renderScale.toFixed(2)}</li>
        <li>frame skip: {frameSkip}</li>
        <li>renderer backend: {rendererMode}</li>
        <li>resolved operations: {resolvedOperationCount}</li>
        <li>quality filtered operations: {filteredOperationCount}</li>
        <li>active operations: {activeOperationCount}</li>
        <li>beauty intensity (UI): {beautyIntensity.toFixed(3)}</li>
        <li>beauty intensity (animated): {animatedBeautyIntensity.toFixed(3)}</li>
        <li>warp strength scale: {warpStrengthScale.toFixed(2)}</li>
        <li>first active operation: {firstActiveOperationSummary}</li>
        <li>FPS: {fps.toFixed(1)}</li>
        <li>frame time: {frameTimeMs.toFixed(2)} ms</li>
        <li>MediaPipe time: {mediapipeTimeMs.toFixed(2)} ms</li>
        <li>renderer time: {rendererTimeMs.toFixed(2)} ms</li>
      </ul>

      <h4>Operation strengths</h4>
      <div>raw preset</div>
      <ul>{rawOperationStrengthSummary.map((line) => <li key={`raw-${line}`}>{line}</li>)}</ul>
      <div>after animation/intensity tracks</div>
      <ul>{intensityOperationStrengthSummary.map((line) => <li key={`intensity-${line}`}>{line}</li>)}</ul>
      <div>resolved (quality/stability/pose applied)</div>
      <ul>{resolvedOperationStrengthSummary.map((line) => <li key={`resolved-${line}`}>{line}</li>)}</ul>
      <div>effective multiplier (resolved/raw)</div>
      <ul>{effectiveMultiplierSummary.map((line) => <li key={`effective-${line}`}>{line}</li>)}</ul>
    </Panel>
  );
}
