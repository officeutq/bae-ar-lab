# BAE AR Lab

BAE AR Lab は、Vite + React + TypeScript で構築された、リアルタイム beauty AR / face warp アルゴリズムの実験用プラットフォームです。

## Milestone 0: Legacy Lab 固定

現在の実装は **legacy BAE AR Lab** として扱います。

Milestone 0 では、動作中の Vite アプリを意図的にリポジトリルートに残しています。これにより、既存の開発コマンドと実行時挙動を変えずに、現行 Lab を今後の Beauty Engine / Beauty Engine Lab 開発のための参考実装・比較対象として保存します。

この Milestone では、新しい Beauty Engine 実装には着手していません。

legacy lab の目印と固定メモ:

- `legacy-lab/README.md`
- `docs/legacy-lab-freeze.md`

起動方法は従来通りです。

- 依存関係のインストール: `npm install`
- 開発サーバー起動: `npm run dev`
- 本番ビルド: `npm run build`
- テスト実行: `npm run test`

このプロジェクトでは、以下をモジュール化して実験できるようにします。

- 顔ランドマーク処理
- 顔ジオメトリ抽出とリージョン処理
- warp operation 設計
- appearance filter 調整
- JSON として保存・移植できる preset workflow

## プロジェクト概要

このリポジトリは、beauty AR pipeline を素早く試行錯誤するためのものです。UI、アルゴリズム定義、ジオメトリ/数学処理、renderer backend をできるだけ疎結合に保つ方針です。

## 現在の機能

- カメラ入力
- Source preview
- Processed preview
- MediaPipe Face Landmarker
- Landmark overlay
- 顔ジオメトリ抽出
- contour / region geometry
- geometry binding
- radial warp
- directional warp
- line warp
- region warp
- weight map / gradient influence
- WebGL renderer
- CPU debug backend
- skin smoothing
- skin tone correction
- preset save/load/import/export
- sample presets

## アーキテクチャ概要

現在の主な責務分担:

- `src/app`: app bootstrap と composition
- `src/app/hooks`: React hook による state/control orchestration
- `src/engine/camera`: camera stream handling
- `src/engine/mediapipe`: MediaPipe Face Landmarker integration
- `src/engine/geometry`: face geometry と region/contour extraction
- `src/engine/algorithms`: algorithm operation pipeline と binding
- `src/engine/math`: 再利用可能な math / interpolation utilities
- `src/engine/render`: renderer orchestration / backend selection
- `src/engine/webgl`: WebGL shader-based rendering implementation
- `src/engine/overlay`: landmark / geometry overlay drawing
- `src/engine/presets`: preset schema と persistence/import-export helpers
- `src/ui/panels`: control と preview panel UI
- `src/algorithms/presets`: built-in sample preset definitions
- `src/types`: shared type definitions

## Rendering Backends

現在の renderer backend:

- `canvas2d`
- `cpu_warp_debug`
- `webgl`

## Preset System

Preset は JSON-serializable かつ portable であることを前提に設計しています。

対応 workflow:

- 現在の設定を保存
- 保存済み設定を読み込み
- preset JSON import
- preset JSON export

## Sample Presets

組み込み sample preset は `src/algorithms/presets` にあります。warp/filter 挙動の比較や調整に使います。

## 現在の runtime QA チェックリスト

- [ ] Camera start / stop
- [ ] Source preview
- [ ] Processed preview
- [ ] WebGL renderer
- [ ] CPU warp debug
- [ ] Landmark overlay
- [ ] Warp visualization
- [ ] Preset save/load/export/import
- [ ] Sample preset switching
- [ ] Skin smoothing
- [ ] Skin tone
- [ ] Beauty intensity
- [ ] Animation playback
- [ ] Timeline scrub
- [ ] Keyframe add/delete/drag
- [ ] Temporal smoothing
- [ ] Face stability fade
- [ ] Pose attenuation
- [ ] Adaptive quality
- [ ] Snapshot capture
- [ ] Compare panel

## Legacy Lab の範囲

legacy lab は、現在のリポジトリルートにある Vite アプリと、以下の実装領域を含みます。

- `src/app`: アプリ構成と runtime orchestration
- `src/app/hooks/useBeautyLabRuntime.ts`: camera、MediaPipe、geometry、stabilization、quality、renderer loop orchestration
- `src/ui`: tuning、preview、timeline、debug、JSON、compare 用の panel/control
- `src/engine`: camera、MediaPipe adapter、geometry、warp math、temporal smoothing、rendering、WebGL、overlay、preset、profiler、capture、adaptive quality
- `src/algorithms`: default preset と JSON-serializable な sample presets
- `src/types`: 共有 preset 型
- `docs`: runtime、mobile、capture、quality に関する現行メモ

この範囲は、今後の新 Engine 開発時にも参照できる working reference として残します。

## Legacy Lab の既知問題

- 一部 UI ラベルと古い docs に文字化けがあります。後続で encoding/content cleanup が必要です。
- `src/app/App.tsx` が大きく、UI orchestration の責務を多く持っています。
- `src/app/hooks/useBeautyLabRuntime.ts` が runtime 責務を広く持っています。legacy 挙動を十分に固定してから分割すべきです。
- WebGL resource cleanup と context-loss handling は強化候補です。
- 自動テストは renderer lifecycle と adaptive quality が中心です。runtime integration、preset migration、warp math、MediaPipe 周辺の coverage は薄めです。
- mobile / long-running / thermal behavior は実機検証が必要です。

## 今後の移植候補

新しい Beauty Engine / Beauty Engine Lab を開始するとき、以下は移植または再設計の候補です。

- JSON-serializable preset schema と migration helpers
- Warp operation model と operation binding rules
- Geometry extraction と target-region helpers
- Warp math と falloff functions
- Temporal smoothing と face stability controls
- Pose attenuation と part-specific attenuation rules
- Renderer backend contract
- WebGL shader implementation patterns
- Snapshot、compare、debug overlay workflows
- Adaptive quality presets と controller behavior

## 開発コマンド

- 依存関係のインストール: `npm install`
- 開発サーバー起動: `npm run dev`
- 本番ビルド: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
