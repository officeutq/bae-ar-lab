# Mirror / Preview / Snapshot / Compare 仕様

## 目的
BAE AR Lab における mirror 表示と capture/export の扱いを固定し、UX と将来の Butterflyve 組み込み時の判断ブレを防ぐ。

## 仕様（確定）

### 1) Preview は mirror
- 対象: source preview / processed preview / source overlay / landmark debug の表示面。
- 方式: CSS の表示レイヤー反転（`preview-mirror`）を使う。
- 非対象: MediaPipe 入力、landmark 座標、canvas 内部描画、WebGL shader/UV。

### 2) Snapshot は raw 基準
- source snapshot は raw video frame を保存する。
- processed snapshot は raw canvas pixel を保存する。
- CSS mirror の見た目は保存画像へ適用しない。

### 3) Compare は raw capture 基準
- Compare は source(raw video) と processed(raw canvas) を同時 capture して比較する。
- 目的は mirror 見た目比較ではなく、実データの加工差分確認。

### 4) Preset export は mirror と無関係
- preset JSON の import/export は加工パラメータのみを扱う。
- mirror 表示状態は preset に含めない。

### 5) Butterflyve publish は今後の判断事項
BAE AR Lab 内では publish 実装を行わない。Butterflyve 組み込み時に以下を決定する。

```text
cast preview: mirror
viewer/publish stream: raw または service policy により決定
```

要判断項目:
- 配信者プレビューと視聴者映像を一致させるか
- 視聴者へ raw を出すか mirror を出すか
- snapshot / moderation / archive との整合


### 6) WebGL processed snapshot の読み出し条件
- processed snapshot が WebGL canvas を読むケースに対応するため、BAE AR Lab の WebGL context は `preserveDrawingBuffer: true` で生成する。
- `preserveDrawingBuffer: true` は描画性能へ影響する可能性があるため、Butterflyve 本番 publish の capture 経路では再評価する。

## 現在実装との対応
- Preview mirror: `SourcePreviewPanel` / `ProcessedPreviewPanel` の `preview-mirror` class で実現。
- Snapshot raw: `createSnapshotExporter` は video/canvas の生ピクセルを PNG 化。
- Compare raw: `App` の compare capture は `readVideoSnapshotDataUrl` + `readCanvasSnapshotDataUrl` を使用。
- Preset export: `presetStorage` の JSON export/import は mirror を扱わない。

## 手動確認観点
1. `npm run dev`
2. Start Camera
3. source preview / processed preview が mirror 表示
4. overlay/landmark が preview と同じ向き
5. source/processed snapshot を保存し、保存画像が raw 基準であることを確認
6. Compare Panel が raw capture 基準であることを確認
7. UI 補足（保存/比較は raw 基準）が表示されることを確認
