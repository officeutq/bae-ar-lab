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

const item = (label: string, value: string) => <li><strong>{label}:</strong> {value}</li>;

export function RuntimeDebugPanel(props: Props) {
  return (
    <Panel title="Runtime Debug Panel（観測専用）">
      <h4>性能 / Performance</h4>
      <ul>
        {item('FPS', props.fps.toFixed(1))}
        {item('Frame time', `${props.frameTimeMs.toFixed(2)} ms`)}
        {item('MediaPipe time', `${props.mediapipeTimeMs.toFixed(2)} ms`)}
        {item('Renderer time', `${props.rendererTimeMs.toFixed(2)} ms`)}
      </ul>

      <h4>顔検出・安定性 / Detection & Stability</h4>
      <ul>
        {item('Detected', props.faceDetected ? 'yes' : 'no')}
        {item('Stability state', props.faceStability.status)}
        {item('Stability confidence', props.faceStability.confidence.toFixed(2))}
        {item('Face stability fade', props.faceStability.fade.toFixed(2))}
        {item('Temporal smoothing', `${props.temporalSmoothingEnabled ? 'on' : 'off'} / alpha ${props.temporalSmoothingAlpha.toFixed(2)}`)}
      </ul>

      <h4>姿勢・弱化 / Pose & Attenuation</h4>
      <ul>
        {item('Yaw（左右向き）', props.facePose?.yaw.toFixed(1) ?? 'n/a')}
        {item('Pitch（上下向き）', props.facePose?.pitch.toFixed(1) ?? 'n/a')}
        {item('Roll（傾き）', props.facePose?.roll.toFixed(1) ?? 'n/a')}
        {item('Attenuation total', props.poseAttenuationFactor.toFixed(2))}
        {item('Attenuation yaw', props.poseAttenuationYawFactor.toFixed(2))}
        {item('Attenuation pitch', props.poseAttenuationPitchFactor.toFixed(2))}
      </ul>

      <h4>Adaptive Quality / 品質制御</h4>
      <ul>
        {item('Adaptive quality', props.adaptiveQualityEnabled ? 'enabled' : 'disabled')}
        {item('Reason', props.adaptiveQualityReason)}
        {item('Selected quality', props.selectedQuality)}
        {item('Current quality', props.currentQuality)}
        {item('Render scale', props.renderScale.toFixed(2))}
        {item('Frame skip', String(props.frameSkip))}
        {item('Quality lock remaining', `${(props.qualityLockRemainingMs / 1000).toFixed(1)}s`)}
        {item('Recovery timer', `${(props.qualityRecoveryElapsedMs / 1000).toFixed(1)}s`)}
      </ul>

      <h4>レンダラ・オペレーション / Renderer & Ops</h4>
      <ul>
        {item('Renderer backend', props.rendererMode)}
        {item('Resolved operation count', String(props.resolvedOperationCount))}
        {item('Quality filtered op count', String(props.filteredOperationCount))}
        {item('Active operation count', String(props.activeOperationCount))}
        {item('Beauty intensity (UI)', props.beautyIntensity.toFixed(3))}
        {item('Beauty intensity (animated)', props.animatedBeautyIntensity.toFixed(3))}
        {item('Warp strength scale', props.warpStrengthScale.toFixed(2))}
        {item('First active operation', props.firstActiveOperationSummary)}
      </ul>

      <h4>Operation strengths（観測用）</h4>
      <div>raw preset</div><ul>{props.rawOperationStrengthSummary.map((line) => <li key={`raw-${line}`}>{line}</li>)}</ul>
      <div>after animation/intensity tracks</div><ul>{props.intensityOperationStrengthSummary.map((line) => <li key={`intensity-${line}`}>{line}</li>)}</ul>
      <div>resolved (quality/stability/pose applied)</div><ul>{props.resolvedOperationStrengthSummary.map((line) => <li key={`resolved-${line}`}>{line}</li>)}</ul>
      <div>effective multiplier (resolved/raw)</div><ul>{props.effectiveMultiplierSummary.map((line) => <li key={`effective-${line}`}>{line}</li>)}</ul>
    </Panel>
  );
}
