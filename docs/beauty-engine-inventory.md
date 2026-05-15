# Beauty Engine 棚卸し（実装前）

最終更新: 2026-05-15  
対象: BAE AR Lab（実装変更なし、既存コード/既存docsの読解ベース）

---

## 1. 方針

BAE AR Lab は「固定フィルタを1個作る場所」ではなく、**TikTokっぽい自然美顔を作るための Beauty エンジン／実験室**として運用する。

- 最初の成果物は `natural_beauty` だが、目的は preset 単体ではない。
- 目的は、自然美顔を**調整・検証・量産できる基盤**（runtime / preset schema / debug / compare / quality運用）を育てること。
- 既存方針（algorithm experimentation platform、UI/renderer/config/MediaPipe adapter の疎結合）と整合させる。 

---

## 2. 現在の構成（Beauty エンジン観点）

### 2.1 runtime
- 中核は `useBeautyLabRuntime`。
- ループ内で `detect -> geometry/pose -> binding -> smoothing -> stability fade -> pose attenuation -> renderer` を処理。
- adaptive quality と profiler が同一runtimeで動作。 

### 2.2 preset
- `WarpPreset` / `WarpOperation` は JSON シリアライズ前提。
- `natural_beauty` / `clean_beauty` / `lite_beauty` / `debug_warp_strong` 等を sample preset として運用。 

### 2.3 warp operation
- operation type: `radial_warp` / `directional_warp` / `line_warp` / `region_warp`。
- target は eye / nose / mouth / jaw / cheek / jaw region を保持。
- `resolveOperationBindings` により line/region の landmark binding を runtime geometry に解決。 

### 2.4 pose / stability
- pose は `computeFacePose`、弱化は `computePoseAttenuation`。
- 顔未検出時は `faceStability.fade` と `lastStableGeometry` を使って急断を回避。
- 現在の attenuation は **global factor 乗算中心**。 

### 2.5 renderer backend
- backend: `canvas2d` / `cpu_warp_debug` / `webgl`。
- runtime から backend factory 経由で差し替え可能。
- WebGL 経路は現行の本命レンダラ。 

### 2.6 debug overlay
- `skin_mask` / `warp_influence` / `attenuation` / `stability` による可視化運用が docs で定義済み。
- 品質判定は overlay 補助、最終は processed 見え方ベース。 

### 2.7 snapshot / compare
- preview は mirror、snapshot / compare は raw 基準（mirror非依存）。
- same-condition 比較と差分記録の導線が整理済み。 

### 2.8 adaptive quality
- quality level: `high -> medium -> low -> critical`。
- warmup / lock / hysteresis を含む downshift/upshift 運用あり。
- runtime で warp強度スケーリング、target無効化、frame skip 等と連動。 

---

## 3. 現在あるパラメータの棚卸し

### 3.1 UI向け Beauty パラメータ
- skin smoothing: `enabled`, `strength`, `radius`, `maskOpacity`, `showMaskPreview`
- skin tone: `enabled`, `brightness`, `saturation`, `warmth`, `blend`
- temporal smoothing: `enabled`, `alpha`
- runtime実験フラグ: `disablePoseAttenuation`, `disableAdaptiveQuality`

### 3.2 preset JSON に含まれるパラメータ
- `schemaVersion`, `id`, `name`, `description`, `operations`, `animations?`, `appearance?`
- operation単位で `enabled`, `type`, `target`, `strength`, `radius`, `falloff`, `axis`, `direction`, `lineStart`, `lineEnd`, `width`, `polygon`, `binding?`, `weightMap?`

### 3.3 WarpOperation のパラメータ
- 幾何系: `axis`, `direction`, `lineStart`, `lineEnd`, `polygon`
- 影響量系: `strength`, `radius`, `width`, `falloff`, `weightMap`
- 適用先系: `type`, `target`, `binding`

### 3.4 engine内部の補正パラメータ
- pose attenuation factor（yaw/pitch要素を含む）
- face stability fade
- runtime quality preset による `warpStrengthScale`, `disabledTargets`, `maxActiveOperations`, `frameSkip`, `renderScale`, `mediapipeIntervalFrames`
- temporal smoothing filter（landmarks / operations）

### 3.5 debug-only パラメータ
- debug overlay mode
- debug系プリセット（`debug_warp_strong`）
- overlay toggles（landmarks / center / influence など）

### 3.6 adaptive quality 連動パラメータ
- `selectedQuality`, `currentQuality`, `reason`
- warmup / lock / recovery 関連時間
- profiler由来 FPS 窓平均値

---

## 4. 現在できていること

- WebGL warp 経路は成立している（renderer backend として実装済み）。
- operation は runtime で binding 解決後に renderer へ渡される。
- `debug_warp_strong` と overlay により shader経路の視覚検証が可能。
- `natural` / `clean` / `lite` の役割分離（baseline / 比較軸 / 低負荷軸）が docs で定義済み。
- overlay / compare / snapshot による評価導線が整備済み。

---

## 5. 現在の問題（段階認識）

現在は「warpが効かない」段階ではなく、**効いているが姿勢依存の不自然さが残る段階**。

- 特に pitch（上下向き）で eye 系 warp の違和感が出やすい。
- 症状として、黒目が大きく見える・目の間隔が狭く見える印象が出る可能性。
- global attenuation のみでは target ごとの見え方差に追従しきれない可能性が高い。

> 注記: 上記症状の定量ログ（端末別・再現率）は本ドキュメント作成時点では**未確認**。既存docs上は主に運用シナリオ/評価軸の定義が中心。

---

## 6. 今後必要なもの（前提の明文化）

### 6.1 part-specific attenuation
- targetごとに姿勢弱化カーブを持つ前提が必要。
- 例:
  - eye: pitch で強めに弱化
  - jaw: yaw で弱化
  - mouth: pitch で弱化
  - skin: 比較的姿勢耐性が高いので弱化を緩める

### 6.2 eye center / radius 算出の保守化
- eye系は違和感が目立ちやすいため、中心点・半径・weight map の算出安定化が重要。
- 現時点で「どの算出式へ統一するか」は**未確認**。

### 6.3 preset値とengine ruleの責務分離
- preset: 表現意図（どの程度盛るか）
- engine rule: 破綻回避（姿勢・安定性・デバイス状態に応じた安全側補正）
- この分離を維持しないと、preset増加時に再調整コストが爆発しやすい。

---

## 7. 次の実装候補（今回の結論）

1. まずは preset JSON へ露出せず、**engine内部ルール**として target別 attenuation を追加する。  
2. `left_eye` / `right_eye` target に対して、pitch attenuation を現状より強めに適用する。  
3. overlay の `attenuation` と `warp_influence` を使って、正面/上下向きの挙動差を確認する。  
4. 効果が確認できたら、preset schema へ公開パラメータとして出すかを判断する（早期に出さない）。

---

## 8. 既存docsとの整合メモ

- runtime品質シナリオ、TikTok品質ガイドライン、mobile test log の運用方針と矛盾しない。
- mirror/preview/capture の raw基準方針と独立（attenuation導入で仕様変更なし）。
- mobile実機手順（HTTPS/LAN）と独立（検証観点のみ追加可能）。

---

## 9. 次アクション

- [ ] eye target の pitch感度を下げる engine内 attenuation 案を最小実装する（preset schema は据え置き）。
- [ ] overlay (`attenuation`, `warp_influence`) を使った before/after 比較手順をテストシナリオへ追記する。
- [ ] `natural_beauty` / `clean_beauty` / `lite_beauty` で同一姿勢（正面・上向き・下向き）を比較記録する。
- [ ] モバイル実機ログに pitch時 eye違和感の観測欄を追加するか検討する。
- [ ] 効果確認後に「engine ruleのまま維持」か「preset schemaへ昇格」かを判断する。

