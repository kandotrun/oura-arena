# Oura Arena

Oura Ring API v2 を使ったチームウェルネスダッシュボード。

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## プレビュー

![ダッシュボード](docs/screenshot.png)
![詳細ページ](docs/detail-screenshot.png)

## 機能

### ダッシュボード（トップページ）
- **スコアリング** — 睡眠・回復・活動スコアをリング表示
- **コンディション判定** — S/A/B/Cランク + 戦闘力で総合評価
- **バトルモード** — メンバー同士のVS表示、勝敗判定、勝利バナー
- **ミニメトリック** — 歩数・カロリー・心拍・安静時心拍をスパークライン付きで表示
- **7日間トレンド** — 睡眠＆回復スコアの推移チャート
- **古いデータ検出** — 最新データがない場合、過去365日まで自動探索

### 詳細ページ（`/user/[name]`）
- **睡眠分析** — 就寝/起床時刻の推移、睡眠時間、タイムライン、規則性スコア
- **睡眠ステージ** — REM/深い/浅い/覚醒の積み上げチャート
- **バイタルトレンド** — HRV・安静時心拍・呼吸数・中途覚醒回数（90日間）
- **レーダーチャート** — 睡眠/回復/活動のスコア要因分析
- **曜日別パターン** — 曜日ごとの平均スコア
- **パーソナルベスト** — 最高睡眠スコア、最多歩数、最長睡眠、最高HRV等
- **ワークアウト履歴** — アクティビティ一覧 + 時間帯散布図
- **体温偏差トレンド**
- **Gen4データ** — SpO2、ストレス、回復力、血管年齢、VO2 Max

### GitHub連携
- **SVGカード** — `GET /api/card/[name].svg` でプロフィールREADMEに埋め込めるヘルスカード
- **バッジ** — `GET /api/badge/[name].svg?metric=sleep|readiness|activity|power|steps|rank`

```markdown
![Health](https://oura-arena.vercel.app/api/card/kan.svg)
![睡眠](https://oura-arena.vercel.app/api/badge/kan.svg?metric=sleep)
```

## セットアップ

### 1. Oura Personal Access Token を取得

[cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens) でトークンを作成。

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```
OURA_USERS=kan:YOUR_PAT,miyamae:THEIR_PAT
```

### 3. 起動

```bash
npm install
npm run dev
```

[localhost:3000](http://localhost:3000) を開く。

## Vercel デプロイ

1. リポジトリをGitHubにpush
2. [vercel.com](https://vercel.com) でインポート
3. 環境変数 `OURA_USERS` を追加
4. デプロイ

ISRで5分ごとにデータ更新。

## 技術スタック

- **Next.js 15** — App Router, Server Components
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** — チャート描画
- **Oura API v2** — 健康データ取得
