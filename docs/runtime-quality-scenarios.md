# Runtime品質検証シナリオ

最終更新: 2026-05-09

本ドキュメントは、BAE AR Lab で顔加工品質を継続評価するためのランタイム検証シナリオを定義する。

## 1. 検証前チェック
- `npm run dev` を起動してカメラを開始する。
- Runtime Debug を表示し、以下が更新されることを確認する。
  - detected (yes/no)
  - face stability (state/confidence/fade)
  - yaw/pitch/roll
  - attenuation factor (total/yaw/pitch)
  - adaptive quality / selected quality / current quality
  - renderer backend / render scale / frame skip
  - active operations / FPS / frame time / MediaPipe time / renderer time

## 2. シナリオ一覧

### Scenario 1: 通常正面
- 条件:
  - 顔を正面に向ける
  - 通常照明
- 期待値:
  - landmark が安定する
  - 加工が自然に追従する
  - FPS が大きく落ちない
- Debug確認:
  - detected: yes が継続
  - face stability fade が 1.00 近傍
  - yaw/pitch が小さく attenuation factor が高い

### Scenario 2: 顔未検出
- 条件:
  - 顔をフレーム外へ出す
  - 手で顔を隠す
- 期待値:
  - 直前形状から自然にフェードアウトする
  - 加工が突然飛ばない
  - 再検出時に急に強く戻らない
- Debug確認:
  - detected: no へ遷移
  - face stability fade が段階的に低下
  - 再検出時も fade が段階的に回復

### Scenario 3: 横顔 / yaw大
- 条件:
  - 顔を左右に大きく向ける
- 期待値:
  - 補正が弱まる
  - 輪郭・目・鼻が破綻しない
  - 顔が戻ったら自然に補正が戻る
- Debug確認:
  - yaw の絶対値が増える
  - yaw attenuation / attenuation factor が低下
  - 正面復帰で attenuation が回復

### Scenario 4: 急旋回 / 急移動
- 条件:
  - 顔を左右上下に素早く動かす
- 期待値:
  - landmark のガタつきが抑えられる
  - 加工が遅れすぎない
  - 顔に貼り付く感じを維持する
- Debug確認:
  - face stability が急落しすぎない
  - frame time と MediaPipe time の急増が継続しない

### Scenario 5: 低照度
- 条件:
  - 暗い部屋で確認する
- 期待値:
  - 過剰な美肌にならない
  - 顔検出が不安定な場合に自然に弱まる
  - ちらつきが少ない
- Debug確認:
  - detected の on/off が増えても fade の遷移が滑らか
  - FPS 極端低下時に adaptive quality が段階的に下がる

### Scenario 6: 低スペック / FPS低下
- 条件:
  - quality を下げる、または低性能端末を想定
- 期待値:
  - adaptive quality が効く
  - FPS低下時に破綻しない
  - renderer が停止/再生成しても落ちない
- Debug確認:
  - current quality が段階的に切り替わる
  - render scale / frame skip が quality preset と整合する
  - renderer backend が期待どおり維持される

## 3. Snapshot / Compare を使った最小手順
1. 通常正面で snapshot
2. 横顔で snapshot
3. 低照度で snapshot
4. Compare panel で違和感（輪郭崩れ、目鼻の位置ずれ、肌トーン破綻）を確認
5. 必要に応じて preset JSON を保存し、再検証条件とセットで管理

## 4. 品質Issue化の推奨テンプレート
- シナリオ名: 例 `Scenario 3: 横顔 / yaw大`
- 端末/ブラウザ: 例 `iPhone 13 / iOS Safari`
- renderer backend: `canvas2d | cpu_warp_debug | webgl`
- quality状態: adaptive on/off, selected/current quality
- 観測値: FPS, frame time, MediaPipe time, renderer time, yaw/pitch/roll, attenuation, face stability fade
- 破綻内容: 発生条件・再現手順・期待値との差分

## 5. ナチュラル美顔（natural_beauty）ベースライン評価

### 評価手順
1. サンプルプリセットで `ナチュラル美顔`（`natural_beauty`）を選択する。
2. 正面で source / processed を確認し、肌質感・輪郭・目鼻口の違和感を目視する。
3. snapshot を保存する（通常照明）。
4. 横顔（左右）にして補正が弱まることを確認する。
5. 顔を一度フレーム外へ出し、再入場時の復帰が急激でないことを確認する。
6. 低照度で確認し、過剰補正やちらつきがないかを見る。
7. Compare panel で source / processed の差を確認し、破綻の有無を記録する。

### 合格基準
- 加工感が強すぎない。
- 肌の質感が残る。
- 目が不自然に大きくならない。
- 輪郭が歪まない。
- 横顔で補正が弱まる。
- 顔が戻った時に急復帰しない。
- FPS が大きく落ちない。
