# Legacy Lab Freeze

Milestone 0 では、現在の BAE AR Lab を legacy reference implementation として固定します。

目的は documentation と boundary setting です。runtime behavior、build scripts、Vite configuration、source structure は意図的に変更しません。

## 現在の実装境界

legacy BAE AR Lab は、現在のリポジトリルートにある Vite アプリです。

legacy として保護する領域:

- `src/app`: app shell と runtime composition
- `src/app/hooks/useBeautyLabRuntime.ts`: camera、MediaPipe、geometry、stabilization、adaptive quality、renderer loop orchestration
- `src/ui`: React panels と controls
- `src/engine/camera`: camera stream handling
- `src/engine/mediapipe`: MediaPipe Tasks Vision adapter
- `src/engine/geometry`: face geometry、pose、contours、regions
- `src/engine/algorithms`: operation binding
- `src/engine/math`: warp と falloff math
- `src/engine/render`: renderer backend contract と canvas CPU/debug renderers
- `src/engine/webgl`: WebGL renderer、shader program helpers、textures、shader files
- `src/engine/temporal`: landmark/operation smoothing、face stability
- `src/engine/performance`: device capability detection と adaptive quality
- `src/engine/presets`: schema、storage、import/export、blending helpers
- `src/engine/overlay`: landmark、warp、beauty debug overlays
- `src/engine/capture`: snapshot export
- `src/algorithms/presets`: built-in sample presets
- `src/types`: JSON-serializable preset types
- `docs`: existing quality、capture、runtime、device notes

## 起動方法

Milestone 0 では起動方法を変更しません。

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`

Windows PowerShell 環境で execution policy により `npm.ps1` がブロックされる場合は、`npm.cmd ...` を使います。

## 現在できること

- Camera input と source preview
- Processed preview
- MediaPipe Face Landmarker integration
- Landmark overlay と face geometry extraction
- Renderer backends: `canvas2d`, `cpu_warp_debug`, `webgl`
- Warp operations: `radial_warp`, `directional_warp`, `line_warp`, `region_warp`
- Appearance filters: `skin_smoothing`, `skin_tone`
- JSON-serializable presets
- Preset save/load/import/export workflows
- Built-in sample presets
- Timeline と animation keyframes
- Temporal smoothing と face stability fade
- Pose attenuation と part-specific attenuation
- Adaptive quality presets と runtime switching
- Snapshot と compare workflows
- Runtime debug と profiler panels

## 既知問題

- 一部 UI ラベルと古い docs に文字化けがあります。
- `src/app/App.tsx` が大きく、多くの UI orchestration concern を持っています。
- `useBeautyLabRuntime` が多数の subsystem を 1 つの hook で調整しています。
- WebGL resource cleanup は、より深い context-loss scenario まではまだ十分に扱えていません。
- Preset schema versioning はありますが、長期的な migration policy は追加の product decision が必要です。
- Runtime testing は camera-to-render の full integration まではまだ覆えていません。
- Mobile thermal と long-running behavior は実機検証が必要です。
- Stronger beauty presets は visual tuning と acceptance criteria がまだ必要です。

## 将来 Engine 作業への移植候補

Milestone 0 では以下に着手しません。後続で再利用または再設計する候補です。

- Preset schema と migration helpers
- Warp operation data model
- Landmark binding rules
- Face geometry と target-region computation
- Warp math functions と falloff curves
- Temporal filters
- Face stability controller
- Pose と part attenuation rules
- Renderer backend lifecycle contract
- WebGL shader architecture
- Debug overlay modes
- Snapshot と compare workflows
- Adaptive quality controller と presets

## 後続の退避案

後で物理的に legacy lab を移動する場合は、以下が安全です。

1. root scripts が動き続けるようにする。
2. 現在の root app を `legacy-lab/app` のような package に移動する。
3. TypeScript aliases、Vite config、Vitest config、import paths をまとめて更新する。
4. root scripts から legacy package に delegate する。
5. 新しい Beauty Engine 実装を始める前に build と test を通す。

それまでは、root app が legacy lab です。
