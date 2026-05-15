import type { QualityLevel } from '@engine/performance/adaptiveQuality';
import type { RendererMode } from '@engine/render/types';

export type DeviceType = 'mobile' | 'desktop';

export type DeviceCapabilities = {
  webgl2Available: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  isMobileBrowser: boolean;
  deviceType: DeviceType;
  maxRecommendedOperationCount: number;
  recommendedQuality: QualityLevel;
  recommendedRendererMode: RendererMode;
  adaptiveQualityDefaultEnabled: boolean;
};

function detectWebgl2Availability(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2'));
}

function detectMobileBrowser(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const webgl2Available = detectWebgl2Availability();
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const isMobileBrowser = detectMobileBrowser(userAgent);
  const navigatorWithMemory = typeof navigator === 'undefined'
    ? null
    : (navigator as Navigator & { deviceMemory?: number });
  const deviceMemoryGb = typeof navigatorWithMemory?.deviceMemory === 'number'
    ? navigatorWithMemory.deviceMemory
    : null;
  const hardwareConcurrency = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
    ? navigator.hardwareConcurrency
    : null;

  const lowMemory = deviceMemoryGb !== null && deviceMemoryGb <= 4;
  const lowCore = hardwareConcurrency !== null && hardwareConcurrency <= 4;

  let recommendedQuality: QualityLevel = 'high';
  if (lowMemory || lowCore) {
    recommendedQuality = 'low';
  } else if (isMobileBrowser) {
    recommendedQuality = 'medium';
  } else if ((deviceMemoryGb ?? 8) >= 8 && (hardwareConcurrency ?? 8) >= 8) {
    recommendedQuality = 'high';
  }

  const recommendedRendererMode: RendererMode = webgl2Available ? 'webgl' : 'canvas2d';

  return {
    webgl2Available,
    deviceMemoryGb,
    hardwareConcurrency,
    isMobileBrowser,
    deviceType: isMobileBrowser ? 'mobile' : 'desktop',
    maxRecommendedOperationCount: recommendedQuality === 'high' ? 12 : recommendedQuality === 'medium' ? 8 : recommendedQuality === 'low' ? 6 : 5,
    recommendedQuality,
    recommendedRendererMode,
    adaptiveQualityDefaultEnabled: true,
  };
}
