import type { WarpFalloffType, WarpOperationType, WarpPreset, WarpTarget, WarpWeightMapType } from '@app-types/preset';
import type { StoredPreset } from '@engine/presets/types';
import type { RendererMode } from '@engine/render/types';
import { samplePresetList, type SamplePresetId } from '@algorithms/presets';
import type { QualityLevel } from '@engine/performance/adaptiveQuality';
import type { BeautyDebugOverlayMode } from '@engine/overlay/beautyDebugOverlay';
import type { DeviceCapabilities } from '@engine/performance/detectDeviceCapabilities';
import type { AnimationClip } from '@engine/animation/types';
import { Panel } from '@ui/Panel';
import { FalloffGraph } from '@ui/components/FalloffGraph';
import { ParameterSlider } from '@ui/components/ParameterSlider';

type Props = {
/* unchanged props */
  activePreset: WarpPreset; beautyIntensity: number; setBeautyIntensity: (value: number) => void; animationPlaying: boolean; animationTime: number; animationLoop: boolean; animationTrackCount: number; animationDuration: number; animationClips: AnimationClip[]; selectedAnimationClipId: string; loadedAnimationClipName: string; selectedAnimationClip: AnimationClip | null; onSelectAnimationClip: (id: string) => void; onLoadAnimationClip: () => void; onUpdateSelectedClipName: (value: string) => void; onUpdateSelectedClipDuration: (value: number) => void; onUpdateSelectedClipLoop: (value: boolean) => void; onUpdateSelectedClipKeyframeTime: (trackIndex: number, keyframeIndex: number, value: number) => void; onUpdateSelectedClipKeyframeValue: (trackIndex: number, keyframeIndex: number, value: number) => void; selectedTrackIndex: number | null; selectedKeyframeIndex: number | null; onPlayAnimation: () => void; onPauseAnimation: () => void; onStopAnimation: () => void; onTimelineTimeChange: (value: number) => void; onSelectKeyframe: (trackIndex: number, keyframeIndex: number) => void; onSelectPrevKeyframe: () => void; onSelectNextKeyframe: () => void; onAddKeyframe: () => void; onDeleteKeyframe: () => void; setAnimationLoop: (value: boolean) => void; pipelineStatus: string; onStartCamera: () => void; onStopCamera: () => void; cameraState: string; showLandmarks: boolean; setShowLandmarks: (value: boolean) => void; showCenters: boolean; setShowCenters: (value: boolean) => void; showWarpInfluence: boolean; setShowWarpInfluence: (value: boolean) => void; showWarpCenter: boolean; setShowWarpCenter: (value: boolean) => void; showFalloffRings: boolean; setShowFalloffRings: (value: boolean) => void; beautyDebugOverlayMode: BeautyDebugOverlayMode; setBeautyDebugOverlayMode: (value: BeautyDebugOverlayMode) => void; rendererMode: RendererMode; setRendererMode: (value: RendererMode) => void; activeOperationIndex: number; setActiveOperationIndex: (value: number) => void; addOperation: () => void; removeOperation: () => void; updateOperation: <K extends keyof WarpPreset['operations'][number]>(key: K, value: WarpPreset['operations'][number][K]) => void; updateAxis: (axisKey: 'x' | 'y', value: number) => void; updateFalloffType: (type: WarpFalloffType) => void; updateDirection: (directionKey: 'x' | 'y', value: number) => void; presetNameInput: string; setPresetNameInput: (name: string) => void; presets: StoredPreset[]; activeStoredPresetId: string | null; onSavePreset: () => void; onCreatePreset: () => void; onDeletePreset: () => void; onRenamePreset: () => void; onLoadPreset: (id: string) => void; selectedSamplePresetId: SamplePresetId | ''; onSelectSamplePreset: (id: SamplePresetId) => void; onExportPreset: () => void; onImportPresetText: (text: string) => void; onCaptureCompare: () => void; presetMessage: string | null; resolvedActiveOperation: WarpPreset['operations'][number] | null; skinSmoothing: { enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean }; updateSkinSmoothing: (patch: Partial<{ enabled: boolean; strength: number; radius: number; maskOpacity: number; showMaskPreview: boolean }>) => void; skinTone: { enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number }; updateSkinTone: (patch: Partial<{ enabled: boolean; brightness: number; saturation: number; warmth: number; blend: number }>) => void; adaptiveQualityEnabled: boolean; onAdaptiveQualityEnabledChange: (value: boolean) => void; selectedQuality: QualityLevel; currentQuality: QualityLevel; onSelectedQualityChange: (value: QualityLevel) => void; capabilities: DeviceCapabilities; temporalSmoothingEnabled: boolean; setTemporalSmoothingEnabled: (value: boolean) => void; temporalSmoothingAmount: number; setTemporalSmoothingAmount: (value: number) => void;
};

export function ControlPanel(props: Props) {
  const op = props.activePreset.operations[props.activeOperationIndex];
  return <Panel title="Developer Tuning Panel（調整専用）">
    <details open><summary>1) UI向け Beauty パラメータ</summary>
      <ParameterSlider label="プリセット強度" description="全体のBeauty適用量です。" value={props.beautyIntensity} min={0} max={1} step={0.01} onChange={props.setBeautyIntensity} caution="上げすぎると加工感が強くなります。" />
      <label><input type="checkbox" checked={props.skinSmoothing.enabled} onChange={(e)=>props.updateSkinSmoothing({enabled:e.target.checked})}/> 美肌（skin smoothing）有効</label>
      <ParameterSlider label="美肌の強さ" description="肌のざらつきやノイズを均一化します。" value={props.skinSmoothing.strength} min={0} max={1} step={0.01} onChange={(v)=>props.updateSkinSmoothing({strength:v})} caution="上げすぎるとのっぺり見えます。" />
      <ParameterSlider label="肌トーンの明るさ" description="肌の明るさ補正です。" value={props.skinTone.brightness} min={-0.2} max={0.2} step={0.01} onChange={(v)=>props.updateSkinTone({brightness:v})} />
      <ParameterSlider label="肌トーンのブレンド" description="肌トーン補正をどの程度混ぜるか。" value={props.skinTone.blend} min={0} max={1} step={0.01} onChange={(v)=>props.updateSkinTone({blend:v})} />
    </details>
    <details><summary>2) Preset JSON パラメータ（概要）</summary>
      <p>Preset: {props.activePreset.name} / schema v{props.activePreset.schemaVersion}</p><p>operations: {props.activePreset.operations.length} / appearance: {props.activePreset.appearance ? 'あり' : 'なし'} / animations: {props.activePreset.animations?.length ?? 0}</p>
      <label>サンプルプリセット<select value={props.selectedSamplePresetId} onChange={(e)=>{ const n=e.target.value as SamplePresetId; if(n) props.onSelectSamplePreset(n);}}><option value="">-- 選択 --</option>{samplePresetList.map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>プリセット名<input type="text" value={props.presetNameInput} onChange={(e)=>props.setPresetNameInput(e.target.value)} /></label>
      <div className="camera-controls"><button type="button" onClick={props.onSavePreset}>保存</button><button type="button" onClick={props.onCreatePreset}>新規</button><button type="button" onClick={props.onExportPreset}>JSON書き出し</button></div>
    </details>
    <details><summary>3) WarpOperation パラメータ</summary>
      <label>対象オペレーション<select value={props.activeOperationIndex} onChange={(e)=>props.setActiveOperationIndex(Number(e.target.value))}>{props.activePreset.operations.map((o,i)=><option key={o.id} value={i}>{i}:{o.id}</option>)}</select></label>
      <label>Type<select value={op?.type ?? 'radial_warp'} onChange={(e)=>props.updateOperation('type', e.target.value as WarpOperationType)}><option value="radial_warp">radial_warp</option><option value="directional_warp">directional_warp</option><option value="line_warp">line_warp</option><option value="region_warp">region_warp</option></select></label>
      <label>Target<select value={op?.target ?? 'left_eye'} onChange={(e)=>props.updateOperation('target', e.target.value as WarpTarget)}><option value="left_eye">left_eye</option><option value="right_eye">right_eye</option><option value="mouth">mouth</option><option value="nose">nose</option><option value="left_jaw">left_jaw</option><option value="right_jaw">right_jaw</option><option value="left_cheek">left_cheek</option><option value="right_cheek">right_cheek</option><option value="jaw_region">jaw_region</option><option value="chin_line">chin_line</option><option value="face_center">face_center</option></select></label>
      <ParameterSlider label="目の変形強度 / Warp strength" description="各部位の変形量です。" value={op?.strength ?? 0} min={-0.2} max={0.2} step={0.01} onChange={(v)=>props.updateOperation('strength', v)} caution="上げすぎると不自然になりやすいです。" />
      <ParameterSlider label="Warp 半径" description="変形影響範囲です。" value={op?.radius ?? 1} min={0.1} max={5} step={0.1} onChange={(v)=>props.updateOperation('radius', v)} />
      <label>Falloff<select value={op?.falloff.type ?? 'smoothstep'} onChange={(e)=>props.updateFalloffType(e.target.value as WarpFalloffType)}><option value="linear">linear</option><option value="smoothstep">smoothstep</option><option value="gaussian">gaussian</option></select></label><FalloffGraph type={op?.falloff.type ?? 'smoothstep'} sampleCount={64} />
      <label>Weight map<select value={op?.weightMap?.type ?? 'uniform'} onChange={(e)=>props.updateOperation('weightMap', { ...(op?.weightMap ?? { center: { x: 0.5, y: 0.5 }, radius: 0.5 }), type: e.target.value as WarpWeightMapType })}><option value="uniform">uniform</option><option value="radial_gradient">radial_gradient</option></select></label>
    </details>
    <details><summary>4) Engine内部補正パラメータ</summary>
      <label><input type="checkbox" checked={props.temporalSmoothingEnabled} onChange={(e)=>props.setTemporalSmoothingEnabled(e.target.checked)} /> Temporal smoothing</label>
      <ParameterSlider label="全体の姿勢弱化（確認用）" description="顔向きが大きい時の減衰はランタイム内部で計算されます。" value={props.temporalSmoothingAmount} min={0.01} max={1} step={0.01} onChange={props.setTemporalSmoothingAmount} note="※ ここは temporal smoothing alpha。pose attenuation は Runtime Debug で観測してください。" />
      <p>face stability fade / pose attenuation は未調整（観測のみ）です。</p>
    </details>
    <details><summary>5) Debug-only パラメータ（本番値ではありません）</summary>
      <label>Beauty Debug Overlay<select value={props.beautyDebugOverlayMode} onChange={(e)=>props.setBeautyDebugOverlayMode(e.target.value as BeautyDebugOverlayMode)}><option value="off">なし</option><option value="skin_mask">美肌範囲</option><option value="warp_influence">変形範囲</option><option value="attenuation">角度弱化</option><option value="stability">安定性</option></select></label>
      <label><input type="checkbox" checked={props.showWarpInfluence} onChange={(e)=>props.setShowWarpInfluence(e.target.checked)} /> Warp影響範囲表示</label>
      <p>WebGL Warp Gain 相当の強加工確認は debug系preset で実施してください。</p>
    </details>
    <details><summary>6) Adaptive Quality 連動パラメータ</summary>
      <label><input type="checkbox" checked={props.adaptiveQualityEnabled} onChange={(e)=>props.onAdaptiveQualityEnabledChange(e.target.checked)} /> 自動品質調整</label>
      <label>手動品質<select value={props.selectedQuality} onChange={(e)=>props.onSelectedQualityChange(e.target.value as QualityLevel)}><option value="ultra">ultra</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></label>
      <p>selected: {props.selectedQuality} / current: {props.currentQuality}</p>
      <p>端末推奨: {props.capabilities.recommendedRendererMode}, {props.capabilities.recommendedQuality}</p>
    </details>
  </Panel>;
}
