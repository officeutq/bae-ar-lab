# BAE AR Lab 実装棚卸し（2026-05-09）

本資料は、`/workspace/bae-ar-lab` 時点のコードを対象に、Butterflyve 組み込み前の顔加工エンジン開発環境としての完成度を整理したもの。

- 対象: runtime / renderer / UI / preset / animation / capture / performance / build
- 実施コマンド: `npm install`, `npm run build`, `npm run test`, `timeout 10s npm run dev`

## 1. 全体構成
- エントリポイント: `src/main.tsx` → `src/app/App.tsx`。
- 実行系の中核: `src/app/hooks/useBeautyLabRuntime.ts`。
- renderer 分離: `src/engine/render` (canvas2d/cpu debug), `src/engine/webgl`。
- preset 分離: 型は `src/types/preset.ts`、保存は `src/engine/presets/presetStorage.ts`。
- animation 分離: `src/engine/animation/*`（timeline + keyframe interpolation）。
- capture 分離: `src/engine/capture/createSnapshotExporter.ts`。
- データフロー（要約）:
  1) Camera start
  2) FaceLandmarker detect
  3) Geometry/Pose計算
  4) binding + temporal smoothing + stability fade + pose attenuation
  5) renderer input
  6) preview/capture/UI更新

## 2. カメラ・MediaPipe
- カメラ開始/停止: `createCameraController().start/stop` でトラックを停止可能。
- MediaPipe初期化: `FilesetResolver.forVisionTasks` + `FaceLandmarker.createFromOptions`。
- MediaPipe資産設定: `src/config/mediapipeAssets.ts` に `MEDIAPIPE_TASKS_VISION_VERSION` / wasm URL / model URL を定義し、初期化側は定数参照のみ。
- wasm/model: `src/config/mediapipeAssets.ts` に集約。wasm は `@mediapipe/tasks-vision@0.10.35` に固定、model は `.../float16/1/face_landmarker.task` の固定URLを使用。
- 検出結果保持:
  - `lastLandmarkFrameRef`（間引き時キャッシュ）
  - `landmarkFrame` state
  - `lastStableGeometryRef`（未検出時のフェード用）
- 顔未検出時: `faceStability` fade > 0 の間は直前安定形状を利用。
- cleanup: unmount で `cancelAnimationFrame`, `renderer.stop`, `overlay.clear`, `faceLandmarker.dispose`, `camera.stop` 実施。

## 3. Renderer Backend
- 実装済み backend:
  - `canvas2d`
  - `cpu_warp_debug`
  - `webgl`
- factory構造: `src/engine/render/createRendererBackend.ts` に backend 生成を集約し、runtime hook は factory 経由で生成。
- `RendererBackend` contract: `src/engine/render/types.ts` で `RendererBackendMode` / `RendererBackendState` / `RendererBackend` を定義。
- `renderer.stop()` 保証: backend所有RAF停止、stop後に新規frameを描画しない、切替/stop時に安全、複数回呼び出し安全(idempotent)、可能な範囲でbackend内参照/GLリソース解放を実施。
- requestAnimationFrame cleanup: renderer内 stop + runtime unmount cleanup 両方あり。
- canvas分離: `ProcessedPreviewPanel` に canvas2d/webgl の2canvasを持ち、表示切替。
- backend切替安全性: 切替時に `rendererRef.current?.stop()` 後に新renderer作成。基本安全。

## 4. Beauty / Warp
- 実装済み加工:
  - appearance: `skin_smoothing`, `skin_tone`
  - warp op type: `radial_warp`, `directional_warp`, `line_warp`, `region_warp`
  - weight map: `uniform`, `radial_gradient`
- 計算場所:
  - 幾何/pose: `src/engine/geometry/*`
  - warp数学: `src/engine/math/warp/*`
  - binding: `src/engine/algorithms/resolveOperationBindings.ts`
  - GPU反映: `src/engine/webgl/createWebglRenderer.ts` のuniform転送
  - CPUデバッグ反映: `src/engine/render/createCpuWarpRenderer.ts`
- pose/yaw attenuation: 実装あり（`computePoseAttenuation`）。
- stability fade: 実装あり（`createFaceStabilityController`）。
- 破綻回避:
  - clamp/最小値ガード（半径・軸・line width等）
  - 非finite値スキップ
  - operation数上限（WebGL側 MAX_OPERATIONS）

## 5. Preset
- 型定義: `WarpPreset` + `WarpOperation` がJSONシリアライズ可能設計。
- sample preset: `src/algorithms/presets/*` に複数。
- save/load/import/export: `presetStorage.ts` で実装済み（load/import時にmigrationを適用）。
- schema versioning: `CURRENT_PRESET_SCHEMA_VERSION = 1`。`schemaVersion` 未指定のlegacy presetは v0 として v1 へ migration。
- migration: `src/engine/presets/presetSchema.ts` の `migratePreset` で必須項目補完（id/name/operations など）と不正operation除外。
- 永続化: `localStorage` (`beauty-lab-presets`)。
- intensity/blend:
  - beauty intensity: `blendPresetByIntensity`
  - skin tone blend: appearance内パラメータで保持
- Butterflyve標準プリセット適合性: 形式は十分。ただし schema version運用・互換戦略は最小実装。

## 6. Animation
- timeline: 実装済み（play/pause/seek/update/loop）。
- keyframe editing: UIで時刻/値編集可。
- keyframe drag: 専用のドラッグUIは未実装（数値入力中心）。
- animation clip: presetに `animations?: AnimationClip[]` を保持可能。
- animation persistence: preset保存時に `activePreset` ごと保存される。
- runtime反映: timeline snapshot values を毎frame `applyAnimatedValues` で preset/intensity に適用。

## 7. Preview / Capture
- source preview: 実装済み。
- processed preview: 実装済み。
- mirror表示: `preview-mirror` class によりプレビューはミラー。
- camera aspect ratio: `previewAspectRatio` で反映。
- compare panel: 実装済み（キャプチャ差分比較）。
- snapshot export: source(video) / processed(canvas) をPNG出力可能。
- mirror影響: 出力は raw video/canvas基準で、CSSミラーの見た目とは一致しない可能性あり。
- mirror仕様ドキュメント: `docs/mirror-preview-capture-spec.md` を追加し、preview=mirror / snapshot=raw / compare=raw / preset export非依存を明文化。
- preview/capture責務分離: captureロジックは `createSnapshotExporter` に分離済み。
- Butterflyve publish mirror方針: BAE AR Lab では未実装。cast previewはmirror、viewer/publish streamはサービスポリシーに基づき今後決定。

## 8. Performance / Profiler
- FPS表示: 実装済み（profiler + runtime debug panel）。
- frame time / renderer time / MediaPipe time: profiler snapshotで保持し、Runtime Debugで常時可視化。
- Runtime Debug拡張: face detected, face stability, yaw/pitch/roll, pose attenuation(total/yaw/pitch), active operation count, renderer backend, render scale, frame skip, adaptive quality状態(selected/current)を表示。
- adaptive quality: 実装済み（quality preset + controller）。
- device capability detection: 実装済み。
- mobile/low spec fallback: 推奨renderer/quality と frame skip/render scale 調整あり。
- memory leak検証情報: 直接的なメモリ統計は未実装。cleanup実装はある。

## 9. UI / 日本語化
- 日本語化済み範囲: Control/Preview 系は概ね日本語。
- 英語残存: Runtime Debug、一部エラー文、内部ラベル/型名。
- 各パネル状態:
  - ControlPanel: 機能多いが密度高く、配信者向けには導線整理余地
  - PreviewPanel群: 実用域
  - Preset: 保存/読込/JSON運用可
  - Animation: 編集可だがDCC的な操作性は未達
  - Profiler: 最低限あり

## 10. Build / 開発環境
- package: Vite + React + TS、`@mediapipe/tasks-vision` は `0.10.35` に固定。
- `npm install`: 成功。
- `npm run build`: 成功。
- `npm run test`: 成功（Vitest, jsdom）。
- `npm run dev`: 起動確認（10秒タイムアウトで意図終了）。
- 既知ログ: npm の `Unknown env config "http-proxy"` warning。

## 10.1 Renderer lifecycle 回帰テスト（追加）
- テスト基盤: Vitest + jsdom（`package.json` の `test` script）。
- 対象:
  - `createRendererBackend` factory（`canvas2d` / `cpu_warp_debug` / `webgl`）。
  - `createCanvasRenderer` の contract（`mode`, `stop`, `getState`）と `stop()` 冪等性。
  - backend 切替ヘルパー `replaceRendererBackend`（旧renderer stop→新renderer create順序）。
- WebGLの扱い:
  - jsdom では実WebGL2 context を扱わず、factory testでは `createWebglRenderer` をmockして contract を固定。
  - 実GPU context / context conflict は手動確認対象に残す。
- canvas context conflict 再発防止方針:
  - processed preview の canvas2d / webgl canvas は分離維持。
  - 同一canvasで 2d と webgl context を取り直さない。
  - backend切替時は `old.stop()` → `new create` の順序をテストと実装で固定。

## 11. Runtime品質検証シナリオ
- 追加ドキュメント: `docs/runtime-quality-scenarios.md` を追加。
- 対象シナリオ: 通常正面 / 顔未検出 / 横顔(yaw大) / 急旋回 / 低照度 / 低スペック(FPS低下)。
- Compare運用: snapshot→compareで差分確認し、preset JSONとセットで管理する最小手順を明記。

## 12. 不足点分類

### A. すでに完成している
- カメラ/MediaPipe基本ループ
- 複数renderer backend切替
- warp4種 + skin smoothing/tone
- preset保存/読込/import/export
- source/processed preview と snapshot

### B. 実装済みだが品質調整が必要
- UI導線（配信者向けモード設計）
- preset schema versioning と互換ポリシー
- animation編集UX（トラック可視化/操作性）
- compare/デバッグ情報の見せ方

- 既知の不足: WebGLの完全なGPUリソース明示解放（context lossまで含む）は今後強化余地あり。

### C. 実装済みだが不安定
- MediaPipe wasm は `@latest` を廃止し `0.10.35` に固定（破壊リスクを低減）
- 顔未検出時のフェード遷移（ケースにより違和感）
- backend切替直後/quality変動時の視覚的ちらつき可能性

### D. 未実装
- keyframe drag UI
- 高度なcapture（動画録画、連番）
- メモリプロファイル統合
- preset/clipの高度管理（タグ、差分、履歴）

### E. Butterflyve組み込み前に必須
1. MediaPipe資産のバージョン固定（wasm: `0.10.35` 固定、model: `float16/1` 固定URL）
2. preset schema契約とmigration戦略
3. renderer backend contractの明文化（API/互換テスト）
4. 非検出時/急旋回時の品質基準（stability・attenuation調整）
5. minimal operator UI と advanced UI の分離
6. e2eスモーク（camera起動→検出→描画→capture）自動化

## 優先Issue候補（上から優先）
1. MediaPipe wasm/model URL pinning + integrity管理
2. Preset schema versioning/migration実装
3. Runtime品質検証シナリオ運用の定着（自動計測/記録フォーマット整備）
4. Animation keyframe drag UI 実装
5. Renderer backend切替/cleanup回帰テスト
6. Snapshotのmirror期待値仕様を明文化（プレビューと保存差）
7. 配信者向けUIプリセット（Simple/Pro）
8. Perf HUD拡張（median/p95, dropped frames, GC兆候）

## 13. Butterflyve標準 baseline preset（natural_beauty）
- 追加内容:
  - `natural_beauty`（表示名: `ナチュラル美顔`）を sample preset に追加。
  - `schemaVersion` は `CURRENT_PRESET_SCHEMA_VERSION` を利用。
  - default preset を `natural_beauty` 相当の弱め設定に寄せ、初期体験を自然寄りへ統一。
- baseline の狙い:
  - 配信用に「加工感を抑えつつ、少し盛れる」ことを優先。
  - 横顔・未検出復帰・低照度で破綻しにくい弱め warp + appearance 構成。
- 現時点で継続調整が必要な点:
  - 端末別（iOS/Android/PC）での最適強度チューニング。
  - 低照度 + 高ISO ノイズ時の skin smoothing 見え方調整。
  - 鼻・口の微調整量（自然さの個人差が出やすい）。
- 追加済み preset:
  - `clean_beauty`（きれいめ）: natural より一段強い比較用プリセット。
- 次に作るべき preset 候補:
  - `glam_beauty`（盛り強め）
  - `lite_beauty`（低負荷）

- Beauty Debug Overlay mode を追加 (`off` / `skin_mask` / `warp_influence` / `attenuation` / `stability`)。
- 加工プレビュー上に専用 canvas を重ね、顔マスク・warp範囲・姿勢弱化・安定性を可視化。
- debug overlay は UI 表示専用で、renderer の実処理および snapshot/export raw には非干渉。
