# delilog - 技術スタック詳細

## 🛠️ 技術スタック概要

delilogは、モダンなWebアプリケーションとして設計され、スケーラブルで保守性の高い技術スタックを採用しています。

## 🎨 フロントエンド（モバイルアプリ）

### コアテクノロジー

| 技術             | バージョン | 用途                | 選定理由                              |
| ---------------- | ---------- | ------------------- | ------------------------------------- |
| **Expo**         | 53.0       | 開発フレームワーク  | React Native開発の簡素化、OTA更新対応 |
| **React**        | 19.0.0     | UIライブラリ        | 最新の機能、Expo SDK 53との互換性     |
| **React Native** | 0.79.5     | モバイルフレームワーク | クロスプラットフォーム開発         |
| **TypeScript**   | 5.8.3      | 型安全性            | 大規模開発での品質向上、IDE支援       |
| **Expo Router**  | 5.1.3      | ナビゲーション      | ファイルベースルーティング、Type-safe |

### スタイリング

| 技術            | バージョン | 用途              | 選定理由                          |
| --------------- | ---------- | ----------------- | --------------------------------- |
| **NativeWind** | 3.x        | スタイリング      | TailwindCSS for React Native     |
| **StyleSheet** | -          | 基本スタイル      | React Native標準、パフォーマンス  |

### UIコンポーネント

| 技術                | バージョン | 用途         | 選定理由                     |
| ------------------- | ---------- | ------------ | ---------------------------- |
| **Lucide React**    | 最新       | アイコン     | 軽量、一貫性のあるデザイン   |
| **React Hook Form** | 7.x        | フォーム管理 | 高性能、優れたバリデーション |
| **Zod**             | 3.x        | スキーマ検証 | TypeScript統合、型安全性     |

### 状態管理

| 技術               | バージョン | 用途               | 選定理由                 |
| ------------------ | ---------- | ------------------ | ------------------------ |
| **Zustand**        | 4.x        | グローバル状態管理 | 軽量、シンプルなAPI      |
| **TanStack Query** | 5.x        | サーバー状態管理   | キャッシュ、同期、最適化 |

## 🔧 バックエンド

### 採用技術：Supabase（BaaS）

| 技術                  | 用途              | メリット                                    |
| --------------------- | ----------------- | ------------------------------------------- |
| **Supabase**          | BaaS              | PostgreSQL、認証、リアルタイム、ストレージ  |
| **PostgreSQL**        | データベース      | 信頼性、ACID準拠、Row Level Security        |
| **Supabase Auth**     | 認証              | OAuth対応、セキュア、簡単実装               |
| **Supabase Storage**  | ファイル管理      | S3互換、CDN対応                             |
| **Supabase Realtime** | リアルタイム同期  | WebSocket、データベース変更の即時反映       |
| **Edge Functions**    | サーバーレス関数  | TypeScript対応、PDF生成等の処理             |

## 🗄️ データベース設計

### 主要テーブル構成

```sql
-- ユーザー管理
users (id, email, name, role, company_id)
companies (id, name, address, license_number)

-- 車両・運転者管理
vehicles (id, license_plate, model, company_id)
drivers (id, license_number, name, company_id)

-- 点呼記録
roll_calls (id, type, datetime, driver_id, manager_id, vehicle_id)
roll_call_items (id, roll_call_id, item_type, value, notes)

-- 監査・レポート
audit_logs (id, user_id, action, timestamp, details)
reports (id, type, period, data, created_at)
```

### データベース要件

- **ACID準拠**: 法的記録の整合性確保
- **バックアップ**: 自動日次バックアップ
- **保存期間**: 法定3年間の自動管理
- **暗号化**: 保存時・転送時の暗号化

## ☁️ インフラ・デプロイ

### 候補プラットフォーム

#### オプション1: Vercel + Supabase

| サービス             | 用途                       | メリット                     |
| -------------------- | -------------------------- | ---------------------------- |
| **Vercel**           | フロントエンドホスティング | 高速CDN、自動デプロイ        |
| **Supabase**         | BaaS（DB + API）           | PostgreSQL、リアルタイム機能 |
| **Vercel Functions** | サーバーレス関数           | スケーラブル、コスト効率     |

#### オプション2: AWS

| サービス        | 用途                       | メリット                   |
| --------------- | -------------------------- | -------------------------- |
| **AWS Amplify** | フロントエンドホスティング | CI/CD統合、スケーラブル    |
| **AWS Lambda**  | サーバーレス関数           | 高可用性、従量課金         |
| **Amazon RDS**  | データベース               | 管理不要、自動バックアップ |
| **Amazon S3**   | ファイルストレージ         | 高耐久性、低コスト         |

## 🔐 セキュリティ

### 認証・認可

| 技術          | 用途         | 実装方法                                |
| ------------- | ------------ | --------------------------------------- |
| **JWT**       | 認証トークン | アクセストークン + リフレッシュトークン |
| **RBAC**      | 権限管理     | ロールベースアクセス制御                |
| **OAuth 2.0** | 外部認証     | Google/Microsoft連携（オプション）      |

### データ保護

- **暗号化**: AES-256（保存時）、TLS 1.3（転送時）
- **入力検証**: Zod + サーバーサイドバリデーション
- **SQLインジェクション対策**: パラメータ化クエリ
- **XSS対策**: CSP（Content Security Policy）

## 📊 監視・分析

### 候補ツール

| ツール               | 用途              | 選定理由                 |
| -------------------- | ----------------- | ------------------------ |
| **Sentry**           | エラー監視        | 詳細なエラートラッキング |
| **Vercel Analytics** | Webアナリティクス | プライバシー重視、軽量   |
| **Uptime Robot**     | 死活監視          | 無料プラン、アラート機能 |

## 🧪 テスト戦略

### フロントエンド

| ツール                    | 用途                 | カバレッジ                |
| ------------------------- | -------------------- | ------------------------- |
| **Vitest**                | 単体テスト           | ユーティリティ関数、hooks |
| **React Testing Library** | コンポーネントテスト | UI動作検証                |
| **Playwright**            | E2Eテスト            | ユーザーシナリオ          |

### バックエンド

| ツール        | 用途       | カバレッジ         |
| ------------- | ---------- | ------------------ |
| **Jest**      | 単体テスト | ビジネスロジック   |
| **Supertest** | APIテスト  | エンドポイント検証 |
| **Postman**   | 手動テスト | API動作確認        |

## 🚀 CI/CD

### 自動化フロー

```yaml
# GitHub Actions 例
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    - lint (ESLint, Prettier)
    - type-check (TypeScript)
    - unit-test (Vitest)
    - e2e-test (Playwright)

  deploy:
    - build (Vite)
    - deploy (Vercel)
    - notify (Slack)
```

## 📱 PWA対応

### 機能

- **オフライン対応**: Service Worker
- **インストール可能**: Web App Manifest
- **プッシュ通知**: 点呼アラート
- **バックグラウンド同期**: オフライン時の記録保存

## 🔄 開発フロー

### Git戦略

- **ブランチ**: main, develop, feature/\*
- **コミット**: Conventional Commits
- **レビュー**: Pull Request必須

### 開発環境

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# ビルド
npm run build

# 型チェック
npm run type-check
```

## 📋 技術選定の決定要因

### 重要な考慮事項

1. **法的要件への対応**: データの整合性・保存期間
2. **スケーラビリティ**: 将来的な利用者増加への対応
3. **保守性**: 長期間の運用・機能追加
4. **セキュリティ**: 企業データの保護
5. **開発効率**: 短期間での高品質な開発

### 最終決定

- **フロントエンド**: React + TypeScript + TailwindCSS（確定）
- **バックエンド**: 要件に応じて Node.js または Python を選択
- **インフラ**: 初期はVercel + Supabase、将来的にAWS移行検討

---

**最終更新**: 2024年12月  
**技術選定ステータス**: フロントエンド確定、バックエンド検討中
