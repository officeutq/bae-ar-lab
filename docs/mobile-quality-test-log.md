# モバイル実機品質検証ログ（iPhone / Android）

## 1. 目的

本ドキュメントは、BAE AR Lab の beauty runtime を iPhone / Android 実機で検証し、比較可能な形で記録を残すための運用フォーマットです。

- iPhone / Android 実機での beauty runtime 検証記録を統一する。
- mobile thermal / long-running / FPS / renderer 安定性を継続評価する。
- Butterflyve 組み込み前の技術判断材料（採用可否・優先度）として利用する。

## 2. 記録テンプレート

```markdown
## YYYY-MM-DD / Device Name

### 基本情報

| 項目 | 値 |
|---|---|
| 端末 |  |
| OS / Version |  |
| Browser |  |
| Network | 同一LAN / その他 |
| URL |  |
| 実施者 |  |

### 実行条件

| 項目 | 値 |
|---|---|
| preset | lite_beauty / natural_beauty / clean_beauty |
| renderer | webgl / canvas2d / cpu_warp_debug |
| quality preset |  |
| adaptive quality level | high / medium / low / critical |
| quality transition | 例: high→medium (fps_drop) |
| change frequency | 例: 10分で3回 |
| duration | 5分 / 10分 / 30分 |
| lighting | 通常 / 逆光 / 低照度 |
| camera orientation | portrait / landscape |
| overlay | off / skin_mask / warp_influence / attenuation / stability |

### 観測値

| 項目 | 開始時 | 5分 | 10分 | 30分 |
|---|---:|---:|---:|---:|
| FPS |  |  |  |  |
| frame time |  |  |  |  |
| MediaPipe time |  |  |  |  |
| renderer time |  |  |  |  |
| render scale |  |  |  |  |
| frame skip |  |  |  |  |

### 体感評価

| 項目 | 評価 | メモ |
|---|---|---|
| 発熱 | 低 / 中 / 高 |  |
| カクつき | なし / 少し / 多い |  |
| 顔追従 | 安定 / 少し不安定 / 不安定 |  |
| 横顔耐性 | 問題なし / 少し違和感 / 破綻 |  |
| 低照度耐性 | 良好 / 許容 / 厳しい |  |
| ブラウザ安定性 | 安定 / リロード / クラッシュ |  |
| バッテリー減り | 小 / 中 / 大 |  |

### 結果

| 項目 | 判定 |
|---|---|
| 継続利用可能 | OK / NG / 要再検証 |
| Butterflyve組み込み候補 | OK / NG / 保留 |
| 次アクション |  |
```

## 3. 短時間テストと長時間テストの基準

### 5分テスト

**目的**
- カメラ起動
- renderer 安定性
- preset 切替
- snapshot / compare
- 明らかな発熱 / クラッシュ検知

**合格目安**
- 映像が止まらない
- ブラウザが落ちない
- FPS が大きく崩れない
- 発熱が急激でない

### 10分テスト

**目的**
- thermal 傾向を見る
- FPS 低下傾向を見る
- face tracking が継続するか見る

### 30分テスト

**目的**
- Butterflyve 組み込み前の最低ライン
- 長時間配信候補として成立するか判断

## 4. preset 別の確認方針

### lite_beauty
- 最初に検証する。
- mobile / thermal 基準として扱う。
- 30分テストの第一候補にする。

### natural_beauty
- 標準 baseline として扱う。
- lite が安定した後に確認する。

### clean_beauty
- 少し盛れる比較軸として扱う。
- 発熱 / FPS 低下が許容範囲か確認する。

### glam_beauty
- 未実装または後回しとする。
- 強加工は破綻回避ルールが固まってから検証する。

## 5. renderer 別の確認方針

### webgl
- 本命 renderer。
- iPhone / Android ともに最優先で確認する。

### canvas2d
- fallback 候補。
- WebGL 不調時の比較対象として記録する。

### cpu_warp_debug
- debug 用途。
- mobile 本命ではない。
- ちらつきがあっても即 NG としない。

## 6. 判定ルール

### NG 条件
- ブラウザクラッシュ
- カメラ停止
- 映像停止
- 10分未満で強い発熱
- FPS が継続的に大きく低下
- 顔追従が継続的に破綻

### OK 条件
- 30分安定
- 発熱が許容範囲
- FPS 低下が軽微
- 顔追従が継続
- preset 切替・snapshot が動作
