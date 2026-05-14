# Mobile Device Testing (iPhone)

> この手順は**開発用**です。本番配信設定ではありません。

## 目的

iPhone Safari / Chrome で `getUserMedia` を使ったカメラ検証を行うため、Vite dev server を HTTPS + LAN 公開で起動します。

## 起動方法

```bash
npm run dev:https
```

`dev:https` は `vite --host 0.0.0.0` を実行し、`vite.config.ts` の `server.https` 設定により HTTPS 起動します。さらに `vite-plugin-mkcert`（`mkcert()`）によりローカル開発用証明書を生成・利用します。

## iPhone 実機検証手順

1. 開発 PC で `npm run dev:https` を実行する。
2. ターミナルに表示される `Network` URL（例: `https://192.168.x.x:5173/`）を確認する。
3. iPhone を同一 LAN に接続し、Safari で Network URL を開く。
4. 証明書警告が表示された場合は詳細画面から続行する。
5. カメラ許可ダイアログで許可する。

## チェック項目

- カメラ起動
- FPS
- 発熱
- 3〜10分放置時の安定性
- preset 切替
- renderer 切替
- snapshot / compare
