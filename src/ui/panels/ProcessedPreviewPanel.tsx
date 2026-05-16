import type { MutableRefObject } from 'react';
import { getRendererModeLabel, type RendererBackendMode, type RendererBackendState } from '@engine/render/types';
import type { BeautyDebugOverlayMode } from '@engine/overlay/beautyDebugOverlay';
import type { AdaptiveQualityReason, QualityLevel, QualityPreset } from '@engine/performance/adaptiveQuality';
import { Panel } from '@ui/Panel';

type Props = {
  canvas2dRef: MutableRefObject<HTMLCanvasElement | null>;
  webglCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  beautyDebugOverlayCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  rendererState: RendererBackendState;
  rendererMode: RendererBackendMode;
  beautyDebugOverlayMode: BeautyDebugOverlayMode;
  adaptiveQualityHud: {
    visible: boolean;
    from: QualityLevel;
    to: QualityLevel;
    reason: AdaptiveQualityReason;
    preset: QualityPreset;
  };
  onCaptureProcessed: () => void;
  previewAspectRatio: string;
};

export function ProcessedPreviewPanel({ canvas2dRef, webglCanvasRef, beautyDebugOverlayCanvasRef, rendererState, rendererMode, beautyDebugOverlayMode, adaptiveQualityHud, onCaptureProcessed, previewAspectRatio }: Props) {
  return (
    <Panel
      title="加工プレビュー"
      headerExtras={(
        <div className="preview-header-meta">
          <span>renderer: {rendererState}</span>
          <span>backend: {getRendererModeLabel(rendererMode)}</span>
          <button type="button" onClick={onCaptureProcessed}>加工映像を撮影</button>
        </div>
      )}
    >
      <div className="preview-frame processed-preview preview-mirror preview-stack" data-preview-role="processed" style={{ aspectRatio: previewAspectRatio }}>
        <canvas className="processed-canvas" data-preview-role="processed-canvas2d" ref={canvas2dRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'none' : 'block' }} />
        <canvas className="processed-canvas" data-preview-role="processed-webgl" ref={webglCanvasRef} style={{ aspectRatio: previewAspectRatio, display: rendererMode === 'webgl' ? 'block' : 'none' }} />
        <canvas className="overlay-canvas beauty-debug-overlay" data-preview-role="beauty-debug-overlay" ref={beautyDebugOverlayCanvasRef} style={{ display: beautyDebugOverlayMode === 'off' ? 'none' : 'block' }} />
        {adaptiveQualityHud.visible && (
          <div className="adaptive-quality-hud" aria-live="polite">
            <div className="adaptive-quality-hud__title">⚡軽量化中</div>
            <div className="adaptive-quality-hud__transition">品質調整: {adaptiveQualityHud.from} → {adaptiveQualityHud.to}</div>
            <div className="adaptive-quality-hud__reason">理由: {adaptiveQualityHud.reason}</div>
            <div className="adaptive-quality-hud__details">
              <span>Scale: {adaptiveQualityHud.preset.renderScale.toFixed(2)}</span>
              <span>Warp: {Math.round(adaptiveQualityHud.preset.warpStrengthScale * 100)}%</span>
              <span>MP: every {adaptiveQualityHud.preset.mediapipeIntervalFrames} frame</span>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
