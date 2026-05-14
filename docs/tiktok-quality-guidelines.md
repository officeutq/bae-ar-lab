# TikTok品質ガイドライン（BAE AR Lab）

本ドキュメントは、BAE AR Lab における「TikTok品質」を、beauty tuning / preset tuning / Butterflyve組み込み前評価で共通利用するための基準として定義する。

## 1. 目的

1. TikTok品質として目指す方向を明文化する
2. beauty quality の評価観点を整理する
3. 合格/不合格の判断基準を定義する
4. preset tuning の優先順位を整理する
5. Butterflyve組み込み前に必要な品質項目を整理する

## 2. TikTok品質の方向性（定義）

BAE AR Lab が目指す TikTok品質は、以下を同時に満たす状態とする。

- **自然さ**: 加工感が強すぎず、顔形状が破綻しない
- **盛れ感**: 静止画だけでなく動画でも印象改善が体感できる
- **安定性**: 急旋回、再検出、低照度で暴れにくい
- **軽さ**: 実運用デバイスで長時間配信可能
- **配信UX**: preview / mirror / compare / snapshot / preset切替が直感的

> 注記: 現時点の BAE AR Lab は「TikTok品質を目指す段階」であり、TikTok品質そのものを達成済みとは見なさない。

## 3. Beauty品質評価軸

### A. 自然さ

重要観点:
- 加工感が強すぎない
- 肌が蝋人形化しない
- 目が怖くならない
- 鼻・口が不自然にならない
- 輪郭がぐにゃっとしない

評価:
- 自然
- やや加工感あり
- 不自然

### B. 盛れ感

重要観点:
- 肌が少し整って見える
- 顔全体が少しまとまって見える
- 目元が少し印象的になる
- 動画で見た時に印象が良い

評価:
- 変化なし
- 少し盛れる
- かなり盛れる
- 過剰

### C. 横顔耐性

重要観点:
- yaw 大時に破綻しない
- attenuation が自然
- 顔輪郭が崩れない
- 鼻が潰れない

評価:
- 問題なし
- 少し違和感
- 破綻

### D. 動作安定性

重要観点:
- 急旋回で暴れない
- face reacquire が自然
- stability fade が急変しない
- landmark jitter が少ない

評価:
- 安定
- 少し不安定
- 不安定

### E. 低照度耐性

重要観点:
- ノイズ時に美肌が破綻しない
- landmark が暴れにくい
- smoothing がのっぺりしすぎない

評価:
- 良好
- 許容
- 厳しい

### F. パフォーマンス

重要観点:
- FPS低下しすぎない
- GPU負荷が高すぎない
- thermal throttle しにくい
- 長時間配信可能

評価:
- 軽い
- 許容
- 重い

### G. 配信向けUX

重要観点:
- preview が自然
- mirror が直感的
- snapshot/compare が使いやすい
- preset 切替が分かりやすい

評価:
- 良好
- 改善余地
- 混乱あり

## 4. 合格/不合格の判断基準（運用）

1. **必須不合格条件（どれか1つでも該当でNG）**
   - 自然さ: 「不自然」
   - 横顔耐性: 「破綻」
   - 動作安定性: 「不安定」
   - パフォーマンス: 「重い」
2. **推奨合格条件（最低ライン）**
   - 自然さ: 「自然」または「やや加工感あり」
   - 盛れ感: 「少し盛れる」以上
   - 横顔耐性: 「問題なし」または「少し違和感」
   - 動作安定性: 「安定」または「少し不安定」
   - 低照度耐性: 「許容」以上
   - パフォーマンス: 「許容」以上
   - 配信向けUX: 「改善余地」以上
3. **正式合格（Butterflyve組み込み候補）**
   - 上記推奨合格条件を満たし、かつ「5. Butterflyve組み込み前の必須品質項目」を全て完了。

## 5. Presetごとの役割

| preset | 役割 |
| --- | --- |
| natural_beauty | 安全側 baseline（自然寄りの標準） |
| clean_beauty | 少し盛れる（比較・微調整用） |
| glam_beauty | 盛り強め（予定） |
| lite_beauty | 低負荷（モバイル/長時間配信向け基準プリセット） |

### tuning優先順位

1. `natural_beauty`: baseline品質を最優先で固定
2. `clean_beauty`: 「少し盛れる」領域の最適化
3. `lite_beauty`: モバイル/長時間運用向けに早期整備
4. `glam_beauty`: 強加工の破綻回避ルール確立後に拡張

## 6. overlay / compare / snapshot の役割

### debug overlay の評価用途

| overlay | 用途 |
| --- | --- |
| skin_mask | 美肌範囲確認 |
| warp_influence | 変形範囲確認 |
| attenuation | 横顔弱化確認 |
| stability | face reacquire確認 |

### compare / snapshot の評価用途

- **snapshot**: source / processed の静止比較記録、presetごとの差分保存
- **compare**: 同一条件で ON/OFF や preset間の視覚差分確認
- **運用原則**: overlay は評価補助、最終品質判定は processed 見え方を主基準にする

## 7. Butterflyve組み込み前の必須品質項目

- 30分以上安定動作
- モバイル検証（iOS/Android）
- thermal確認
- 配信遅延確認
- snapshot/export確認
- mirror UX確認
- beauty ON/OFF比較
- low-light確認

## 8. 現時点で未達の項目（明示）

- モバイル thermal 未検証
- 長時間配信未検証（30分以上の連続評価が不足）
- 強加工系 preset（`glam_beauty`）未調整
- 実配信 publish 未統合
- GPU負荷計測不足（端末別の継続計測基盤が不足）

## 9. 今後のロードマップ（要約）

1. baseline固定: `natural_beauty` を評価軸A〜Gで再チューニング
2. 比較軸整備: `clean_beauty` と ON/OFF 比較テンプレート化
3. 運用性能整備: `lite_beauty` を基準に thermal/長時間評価（mobile優先）
4. 表現拡張: `glam_beauty` を破綻回避ガード付きで追加
5. 統合判定: Butterflyve組み込み前チェックリストを満たした preset のみ昇格


## 10. lite_beauty の運用位置づけ（2026-05-14 追加）

- `lite_beauty` は **モバイル端末・長時間配信向けの低負荷プリセット** として追加。
- 目的は「自然さ > 軽さ > 少し盛れる」で、強加工ではなく安定運用を優先。
- 評価対象:
  - mobile thermal（発熱しにくさ）
  - long-running（30分以上の連続運用安定性）
  - 低照度時の破綻しにくさ
- compare/overlay 運用基準:
  - `warp_influence` で `clean_beauty` より影響範囲が小さいこと
  - `natural_beauty` よりも軽量寄りであること
  - compare ON/OFF で「わずかに印象改善、加工感は少ない」を満たすこと
