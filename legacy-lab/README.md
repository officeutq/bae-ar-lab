# Legacy BAE AR Lab

このディレクトリは、Milestone 0 における現行 BAE AR Lab 実装のマーカーです。

現時点では、legacy lab のコードはまだこのディレクトリへ移動していません。動作中の Vite アプリはリポジトリルートに残しているため、既存コマンドはそのまま使えます。

- `npm run dev`
- `npm run build`
- `npm run test`

## このディレクトリの目的

現在の Lab を、今後の Beauty Engine / Beauty Engine Lab 開発に対する legacy reference implementation として固定するための目印です。

Milestone 0 ではコードを移動せず、意図しない runtime 変更を避けながら legacy 境界を明確にします。

## 現在の Legacy 範囲

legacy lab は、リポジトリルートの Vite アプリと、以下の既存実装を指します。

- `src/app`
- `src/ui`
- `src/engine`
- `src/algorithms`
- `src/types`
- `src/config`
- `src/shaders`
- `docs`

## 将来の退避案

後続 Milestone で legacy app を物理的に移動する場合は、まず現行挙動を維持することを優先します。

1. 既存の root app を `legacy-lab/app` または同等の package boundary に移動する。
2. Vite、TypeScript path alias、test config、npm scripts を小さな migration としてまとめて更新する。
3. root から legacy lab を起動できる command を残す。
4. 新 Engine 開発に入る前に `npm run build` と `npm run test` を実行する。

その移動を行うまでは、このディレクトリは runtime の置き場所ではなく、legacy lab の signpost として扱います。
