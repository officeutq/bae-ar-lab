export type DeveloperTuningState = {
  pose: { pitchStart: number; pitchEnd: number; pitchMin: number; yawStart: number; yawEnd: number; yawMin: number };
  partAttenuation: { eyePitchMultiplier: number; eyeYawMultiplier: number; mouthPitchMultiplier: number; jawYawMultiplier: number };
  stability: { fadeOutSpeed: number; fadeInSpeed: number; minimumConfidence: number };
  temporal: { landmarkSmoothingAlpha: number; operationSmoothingAlpha: number };
  warpSafety: { globalWarpStrengthScale: number; maxOperationStrength: number; minRadius: number; maxRadius: number };
  debug: { webglWarpGain: number; strongDebugGain: number; colorStrength: number };
};

export const DEFAULT_DEVELOPER_TUNING: DeveloperTuningState = {
  pose: { pitchStart: 14, pitchEnd: 32, pitchMin: 0.65, yawStart: 12, yawEnd: 35, yawMin: 0.3 },
  partAttenuation: { eyePitchMultiplier: 1, eyeYawMultiplier: 1, mouthPitchMultiplier: 1, jawYawMultiplier: 1 },
  stability: { fadeOutSpeed: 0.08, fadeInSpeed: 0.12, minimumConfidence: 0.15 },
  temporal: { landmarkSmoothingAlpha: 0.35, operationSmoothingAlpha: 0.35 },
  warpSafety: { globalWarpStrengthScale: 1, maxOperationStrength: 0.2, minRadius: 0.1, maxRadius: 5 },
  debug: { webglWarpGain: 1, strongDebugGain: 1, colorStrength: 1 },
};
