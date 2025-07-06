# delilog - 運送業点呼記録アプリ

## 概要

delilog（デリログ）は、貨物軽自動車運送事業者向けの点呼記録管理アプリケーションです。

## 技術スタック

- **フレームワーク**: React Native (Expo SDK 53)
- **言語**: TypeScript 5.8.3
- **スタイリング**: React Native StyleSheet / NativeWind (予定)
- **状態管理**: Zustand
- **バックエンド**: Supabase
- **ナビゲーション**: Expo Router 5.1.3
- **フォーム**: React Hook Form + Zod

## 開発環境のセットアップ

### 必要な環境

- Node.js 18.x 以上
- npm または yarn
- Expo Go アプリ（iOS/Android）※SDK 53対応版
- Watchman（推奨）: `brew install watchman`

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してSupabaseの認証情報を設定：
# EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 開発サーバーの起動

```bash
# Expo 開発サーバーを起動
npm start

# iOS シミュレーターで起動
npm run ios

# Android エミュレーターで起動
npm run android

# Web ブラウザで起動
npm run web
```

### その他のコマンド

```bash
# コードのリント
npm run lint

# コードのフォーマット
npm run format

# 型チェック
npm run type-check
```

## プロジェクト構造

```
delilog/
├── app/               # Expo Router画面定義
│   ├── (auth)/        # 認証関連画面
│   │   ├── login.tsx  # ログイン画面
│   │   └── register.tsx # 初回登録画面
│   ├── (tabs)/        # タブナビゲーション画面
│   │   ├── index.tsx  # ホーム画面
│   │   ├── records.tsx # 記録一覧
│   │   └── settings.tsx # 設定画面
│   ├── _layout.tsx    # ルートレイアウト
│   └── index.tsx      # エントリーポイント
├── src/
│   ├── components/    # 再利用可能なコンポーネント
│   │   ├── ui/        # 汎用UIコンポーネント
│   │   └── features/  # 機能固有コンポーネント
│   ├── hooks/         # カスタムフック
│   │   ├── useAuth.ts # 認証状態管理
│   │   └── useTenko.ts # 点呼記録状態管理
│   ├── services/      # 外部サービス連携
│   │   ├── supabase.ts     # Supabaseクライアント
│   │   ├── authService.ts  # 認証サービス
│   │   ├── tenkoService.ts # 点呼記録サービス
│   │   └── vehicleService.ts # 車両管理サービス
│   ├── store/         # 状態管理（Zustand）
│   │   ├── authStore.ts  # 認証ストア
│   │   └── tenkoStore.ts # 点呼記録ストア
│   ├── types/         # TypeScript型定義
│   │   └── database.ts # Supabaseデータベース型
│   ├── utils/         # ユーティリティ関数
│   └── constants/     # 定数定義
│       └── colors.ts  # カラーパレット
├── assets/            # 画像、フォント等のアセット
├── database/          # データベース関連
│   └── migrations/    # SQLマイグレーションファイル
├── docs/              # プロジェクトドキュメント
├── package.json       # NPM設定（main: "expo-router/entry"）
├── DEVELOPMENT_PRINCIPLES.md # 開発原則
└── DEVELOPMENT_LOG.md # 開発ログ
```

## 開発ガイドライン

- コーディング規約は `docs/03-guidelines/delilog-coding-standards.md` を参照
- デザインシステムは `docs/03-guidelines/delilog-ui-design-system.md` を参照
- コミットメッセージは Conventional Commits 形式を使用
- 開発原則は `DEVELOPMENT_PRINCIPLES.md` を必ず確認

## 現在の開発状況（2025年7月5日時点）

### ✅ 完了済み
- **Week 1**: 認証機能とプロジェクトセットアップ
  - Apple認証・Google認証・テスト認証
  - 初回登録フロー（屋号・運転者名・車両番号）
  - 認証状態管理とナビゲーション
- **Week 2**: データベース設計とホーム画面
  - Supabaseテーブル設計（RLS対応）
  - ホーム画面UI（リアルタイムデータ連携）
  - 状態管理アーキテクチャ（Zustand）
- **Week 3**: 点呼記録機能（業務前）✅
  - 業務前点呼フォーム（React Hook Form + Zod）
  - フォーム制御とバリデーション
  - データ保存とフィードバック機能
  - 音声入力基盤（Expo AV）
  - キーボード対応とUX改善

### 📋 今後の予定
- Week 4: 点呼記録機能（業務後）と設定画面
- Week 5: 記録一覧画面
- Week 6: PDF生成機能
- Week 7-12: 最適化・テスト・リリース準備

## 重要なドキュメント

- [開発原則](DEVELOPMENT_PRINCIPLES.md) - 開発時の必須ルール
- [開発ログ](DEVELOPMENT_LOG.md) - 技術的な決定事項の記録
- [プロジェクト概要](docs/00-overview/project-overview.md)
- [要件定義](docs/01-requirements/delilog-requirements.md)
- [開発計画](docs/01-requirements/delilog-dev-plan.md)

### 設計決定記録
- [Week 3: アルコール検知項目の設計決定](docs/04-decisions/week3-alcohol-detection-decision.md)

### 参照資料
- [行政資料・法的文書](docs/05-references/) - 国土交通省様式例、法令等

## トラブルシューティング

### EMFILE: too many open files エラー
```bash
# Watchmanをインストール
brew install watchman
# キャッシュをクリア
watchman watch-del-all
```

### Expo Goバージョンエラー
- 最新のExpo Go（SDK 53対応）を使用
- または`npm run ios`でシミュレーターを使用

## ライセンス

Proprietary - All rights reserved
