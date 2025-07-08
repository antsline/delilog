# delilog 開発ログ

## 開発環境構築時の重要事項

### SDK バージョンについて（2025年7月5日）

#### 問題
- 当初、開発計画書ではExpo SDK 50を使用予定だったが、最新のExpo GoアプリはSDK 53に対応しており、互換性エラーが発生した
- SDK 50とSDK 53の間で依存関係の競合が多発

#### 解決策
- **Expo SDK 53を採用**することで統一
- React 19.0.0 + React Native 0.79.5の組み合わせで安定動作

#### 最終的な技術スタック
```json
{
  "expo": "~53.0.0",
  "expo-router": "~5.1.3",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "@types/react": "~19.0.10",
  "typescript": "~5.8.3"
}
```

### Expo Router設定
- `package.json`の`main`フィールドを`"expo-router/entry"`に設定
- App.tsxファイルは不要（削除済み）

## Week 3 の開発ログ

### アルコール検知項目の設計決定

**背景**: 要件定義では「アルコール検知器使用」「酒気帯びの有無」「アルコール数値」の3項目が定義されていたが、UX向上のため見直しを実施。

**決定**: 入力時はアルコール数値のみ、記録簿出力時に自動判定結果を表示する方式を採用。

**理由**:
1. **論理的整合性**: 数値入力があれば検知器使用と酒気帯びの有無は自動判定可能
2. **UX向上**: 冗長な入力項目を削減
3. **データ整合性**: 手動選択による矛盾を防止
4. **法的要件**: PDF出力時に必要な全項目を自動生成

**技術的実装**:
```typescript
// 自動判定ロジック
const alcoholDetectorUsed = parseFloat(data.alcoholLevel) > 0.00;
const alcoholDetected = parseFloat(data.alcoholLevel) > 0.00;
```

### React Hook Form + Zod導入

**目的**: フォーム状態管理とバリデーションの強化

**実装内容**:
- useStateからReact Hook Formへの移行
- Zodスキーマによる型安全なバリデーション
- リアルタイムバリデーション（onChange）
- エラーメッセージの適切な表示

**利点**:
- パフォーマンス向上（不要な再レンダリング削減）
- 型安全性の向上
- バリデーションロジックの一元化

### 音声入力機能の基盤実装

**技術スタック**: Expo AV使用

**実装内容**:
- カスタムマイクアイコンデザイン
- 録音開始/停止の制御
- 録音状態の視覚的フィードバック
- 特記事項フィールドへのテキスト追加

**将来拡張**: 音声認識APIとの連携（現在は仮実装）

### UI/UX改善

**キーボード対応**:
- KeyboardAvoidingViewの導入
- iOS/Android別の最適化
- 自動スクロール機能

**デザイン統一**:
- 健康状態・日常点検のボタンスタイル統一
- 選択時の色を全て黒（charcoal）に統一
- 音声入力ボタンをオレンジに変更

### データ保存とフィードバック実装

**保存フロー**:
1. フォームバリデーション
2. データ変換（TenkoRecordInsert型）
3. Supabaseへの保存
4. 成功/失敗フィードバック
5. ホーム画面への自動遷移

**UX改善**:
- ローディング状態の視覚的表示（ActivityIndicator）
- エラーハンドリングと適切なメッセージ
- 保存中のボタン無効化

### 必要な追加パッケージ
SDK 53 + Expo Router 5では以下のパッケージが必要：
- expo-constants
- expo-linking
- expo-system-ui
- react-native-safe-area-context
- react-native-screens

### ファイル監視エラーの解決
macOSで`EMFILE: too many open files`エラーが発生した場合：
1. Watchmanをインストール: `brew install watchman`
2. Watchmanキャッシュをクリア: `watchman watch-del-all`

### 環境変数
Supabaseの接続情報は`.env`ファイルに設定：
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 今後の開発時の注意点

1. **SDKバージョン**: 常に最新のExpo SDK（現在53）を使用する
2. **型チェック**: `npm run type-check`を定期的に実行
3. **キャッシュクリア**: 問題発生時は`npx expo start --clear`でMetroキャッシュをクリア
4. **デバイステスト**: 
   - 実機: 最新のExpo Goアプリを使用
   - シミュレーター: SDK互換性の問題を回避できる
   - Web: 初期テストに便利（`w`キー）

## Week 2: データベース設計とホーム画面（2025年7月5日）

### 完了した主要機能

#### Day 8-9: データベース構築
- **テーブル設計**: `users_profile`, `vehicles`, `tenko_records`
- **Row Level Security**: ユーザーデータの完全分離を実現
- **データベーストリガー**: 
  - 自動updated_at更新
  - デフォルト車両制約（ユーザーあたり1台のみ）
- **インデックス**: パフォーマンス最適化
- **マイグレーション**: SQLファイルでバージョン管理

#### Day 10-11: ホーム画面UI
- **タブナビゲーション**: ホーム・記録一覧・設定の3画面構成
- **ホーム画面レイアウト**: 
  - パーソナライズされた挨拶
  - 今日の点呼状況表示
  - 業務前/業務後点呼ボタン
  - クイックアクションメニュー
- **デザインシステム**: delilogアースカラーパレットの統一

#### Day 12-14: 状態管理とデータ連携
- **Zustandストア**: `tenkoStore.ts`で点呼記録の状態管理
- **サービス層アーキテクチャ**:
  - `authService.ts`: 認証とプロフィール管理
  - `tenkoService.ts`: 点呼記録のCRUD操作
  - `vehicleService.ts`: 車両管理（新規作成）
- **カスタムフック**: `useTenko.ts`でUIとデータ層の連携
- **リアルタイム更新**: Supabase Realtimeで自動同期

### 技術的な重要な決定事項

#### データベース設計の工夫
1. **外部キー制約**: データ整合性の保証
2. **UNIQUE制約**: 重複記録の防止（同一日・同一タイプ・同一車両）
3. **CHECK制約**: データの妥当性チェック
4. **論理削除**: 車両の`is_active`フラグによる安全な削除

#### 状態管理アーキテクチャ
- **認証状態**: `authStore.ts`（既存）
- **点呼記録状態**: `tenkoStore.ts`（新規）
- **サービス層の分離**: 責任の明確化と再利用性向上

#### エラーハンドリング戦略
- **認証エラー**: ログイン画面への自動リダイレクト
- **データ取得エラー**: ユーザーフレンドリーなエラーメッセージ + 再試行機能
- **トランザクション**: プロフィール作成時のロールバック対応

### 実装したファイル一覧

#### データベース
- `database/migrations/001_initial_schema.sql`
- `database/migrations/002_rls_policies.sql`

#### 状態管理
- `src/store/tenkoStore.ts`
- `src/hooks/useTenko.ts`

#### サービス層
- `src/services/tenkoService.ts`
- `src/services/vehicleService.ts`
- `src/services/authService.ts`（更新）

#### UI層
- `app/(tabs)/index.tsx`（ホーム画面）
- `app/(tabs)/_layout.tsx`（タブナビゲーション）

#### 型定義
- `src/types/database.ts`（大幅更新）

### Week 2で解決した技術課題

1. **SQLエラーの解決**: トリガー・ポリシーの重複エラー → `DROP IF EXISTS`で解決
2. **型定義の整合性**: Insert型とRow型の統一
3. **エラーハンドリング**: 認証ローディング状態の適切な処理
4. **サービス層の重複**: 車両管理をVehicleServiceに集約

### 動作確認項目（完了）
- ✅ ログイン後、ユーザー名が表示される
- ✅ 今日の点呼状態が正しく表示される
- ✅ リアルタイム更新が動作する
- ✅ エラー時の適切なフィードバック

### Week 3への引き継ぎ事項

1. **ホーム画面のアクションボタン**: Week 3で点呼記録画面との連携が必要
2. **車両選択**: デフォルト車両の自動選択が実装済み
3. **データベース**: 点呼記録の保存・取得のインフラが完成

## Week 4: 業務後点呼と設定画面（2025年7月6日）

### 完了した主要機能

#### Day 22-23: 業務後点呼実装
- **業務後点呼画面**: 業務前をベースに作成（`app/(tabs)/tenko-after.tsx`）
- **運行状況項目**: 業務後特有の運行結果入力
- **データ保存処理**: `type='after'`で業務後記録を分別保存
- **フォーム最適化**: React Hook Form + Zodバリデーション適用

#### Day 24-25: 車両管理機能
- **設定画面タブ構成**: プロフィール・車両・その他の3タブ
- **車両CRUD操作**:
  - 追加: 新規車両登録機能
  - 編集: ナンバープレート変更機能
  - 削除: 車両削除機能（デフォルト車両の場合は警告表示）
  - デフォルト設定: デフォルト車両の切り替え機能
- **車両管理UI最適化**:
  - 車両追加ボタンを画面下部に配置
  - 削除ボタンを白色に変更（視認性向上）
  - デフォルトバッジをカード右上に配置
  - 車両番号は中央表示を維持

#### Day 26-28: プロフィール編集機能
- **プロフィール編集画面**: 屋号、運転者名、営業所名の編集機能
- **バリデーション実装**: 必須項目チェック（屋号・運転者名）
- **API連携**: `AuthService.updateUserProfile()`でプロフィール更新
- **設定画面からの遷移**: スムーズなナビゲーション実装

### 重要なバグ修正（Week 4）

#### 1. TouchableOpacity iOS応答性問題（解決済み）
**問題**: 設定画面のボタンが一定時間後に反応しなくなる

**原因**: iOS特有のタッチイベント処理とScrollView設定の問題

**解決策**:
```typescript
<ScrollView keyboardShouldPersistTaps="handled">
  <TouchableOpacity
    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    delayPressIn={0}
    delayPressOut={0}
  >
```

#### 2. register.tsx ルーティング混乱問題（解決済み）
**問題**: register.tsxが意図しないルート（`/(tabs)/settings`など）で呼び出される

**原因**: Expo Routerの設定不備とパス判定ロジックの不具合

**解決策**: 
- パス条件チェックの実装
- リダイレクト処理の最適化
- 責任範囲の明確化

#### 3. テストログイン画面遷移問題（解決済み）⭐重要⭐
**問題**: テストログイン成功後に白画面表示、画面遷移が不能

**根本原因**（複合的問題）:
1. **競合状態（Race Condition）**: `index.tsx`と`login.tsx`で同時にナビゲーション処理実行
2. **無限ループ**: `useFocusEffect`の依存配列による再レンダリング
3. **永続ローディング**: `authLoading`状態の不適切な管理

**解決策**:
```typescript
// 1. 責任の明確化 - index.tsxで一元管理
// app/index.tsx
React.useEffect(() => {
  if (user && hasProfile) {
    router.replace('/(tabs)');
  }
}, [user, hasProfile]);

// 2. 無限ループ防止 - 依存配列最適化
// app/(tabs)/index.tsx
useFocusEffect(
  React.useCallback(() => {
    if (user) {
      refreshData();
    }
  }, [user?.id]) // refreshDataを依存配列から削除
);

// 3. 条件付きローディング表示
if (authLoading && !(user && profile)) {
  return <LoadingScreen />;
}
```

### 技術的な学び（Week 4）

#### 1. Expo Router 3.5.18の制約と対処法
- **古いバージョンの問題**: 競合状態に対する対処が不十分
- **依存関係の制約**: 最新版へのアップデートが困難
- **重要な対処法**: ナビゲーション処理の責任分離と一元管理

#### 2. React Native + iOS開発の注意点
- **TouchableOpacity問題**: iOS特有の応答性問題
- **keyboardShouldPersistTaps**: キーボード表示時のタッチイベント制御
- **hitSlop設定**: タッチ領域の最適化が重要

#### 3. 状態管理とナビゲーションの協調
- **認証状態とナビゲーション**: 複数箇所での処理は競合の原因
- **useEffect依存配列**: 関数依存は無限ループの原因となりうる
- **ローディング状態**: 適切な条件分岐が重要

### Week 4実装ファイル一覧

#### 新規作成
- `app/(tabs)/tenko-after.tsx` - 業務後点呼画面
- `app/settings/_layout.tsx` - 設定画面レイアウト
- `app/settings/vehicles.tsx` - 車両管理画面
- `app/settings/profile.tsx` - プロフィール編集画面
- `src/types/profileValidation.ts` - プロフィール編集用バリデーション

#### 主要更新
- `app/(tabs)/settings.tsx` - タブ構成への改修
- `src/services/vehicleService.ts` - 車両CRUD操作追加
- `src/services/authService.ts` - プロフィール更新機能追加
- `app/index.tsx` - 認証状態判定ロジック改善
- `app/(auth)/login.tsx` - テストログイン遷移処理修正

### 動作確認項目（Week 4完了）
- ✅ 業務後点呼記録の保存・表示
- ✅ 車両の追加・編集・削除・デフォルト設定
- ✅ プロフィール編集機能
- ✅ 設定画面のタブナビゲーション
- ✅ TouchableOpacityの応答性（iOS）
- ✅ テストログインの画面遷移

### Week 5への引き継ぎ事項

1. **記録一覧画面**: 過去の点呼記録表示機能の実装
2. **検索・フィルタリング**: 日付範囲、車両、記録タイプでの絞り込み
3. **記録詳細表示**: 個別記録の詳細確認機能
4. **PDF出力準備**: 記録一覧からのPDF生成準備

## 現在の開発状況（Week 4完了時点）

### ✅ 完了済み機能
1. **認証機能**: Apple ID、Google、テスト認証（白画面問題解決済み）
2. **プロフィール管理**: 作成・編集機能
3. **車両管理**: 完全なCRUD操作
4. **点呼記録**: 業務前・業務後の記録機能
5. **ホーム画面**: 今日の状況表示とナビゲーション
6. **設定画面**: 3タブ構成（プロフィール・車両・その他）

### 🔄 次の実装対象
- **Week 5: 記録一覧画面**

### 技術スタック（最終確定）
```json
{
  "expo": "~52.0.11",
  "expo-router": "3.5.18",
  "react": "18.3.1",
  "react-native": "0.79.4",
  "@supabase/supabase-js": "^2.39.3",
  "zustand": "^4.4.7",
  "react-hook-form": "^7.48.2",
  "zod": "^3.22.4"
}
```

## Week 5+: UI/UXデザイン統一作業（2025年7月8日）

### 完了した主要作業

#### ヘッダーデザインの統一
**問題**: タブページ間でヘッダーデザインにばらつきがあり、統一感に欠けていた

**解決策**: 設定ページのシンプルなヘッダーデザインを基準に全ページを統一
- **基本構造**: SafeAreaView + StatusBar + ヘッダー
- **スタイル仕様**: 28px太字タイトル、20px水平padding、32px下padding
- **背景色**: `colors.cream`で統一

**適用したページ**:
1. **記録一覧ページ（records.tsx）**
   - SafeAreaViewとStatusBarを追加
   - 「記録一覧」タイトルのヘッダーを新設
   - 年月ナビゲーションをヘッダー外に分離
   - 矢印ボタンをシンプルなデザインに変更（枠線削除）

2. **PDF出力ページ（pdf-export.tsx）**
   - ヘッダーを統一デザインに変更
   - 不要なサブタイトルを削除
   - セクション間の余白を調整（設定ページと同様の間隔に）

#### 背景色ルールの策定と適用
**新ルール**: 機能別背景色の明確化
- **ボタン・タップ可能要素**: 白背景（`#FFFFFF`）
- **情報表示要素**: ベージュ背景（`colors.cream`）

**適用作業**:
- **設定ページ**: メニューボタンの背景を白色に変更
- **記録一覧ページ**: 背景色を薄いグレーからベージュに統一

#### UIデザインの細かい調整
1. **PDF出力ページ**: 選択項目の枠線色をオレンジから黒に変更
2. **記録一覧ページ**: 月切り替えボタンのデザイン簡略化
3. **全体**: 余白・間隔の微調整

### 技術的な実装詳細

#### 統一ヘッダーの実装パターン
```typescript
// 基本構造
<SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
  <StatusBar style="dark" backgroundColor={colors.cream} />
  
  <View style={styles.header}>
    <Text style={styles.title}>ページタイトル</Text>
  </View>
  
  <ScrollView style={styles.scrollView}>
    {/* コンテンツ */}
  </ScrollView>
</SafeAreaView>

// スタイル定義
const styles = {
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: colors.cream,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
};
```

#### 機能別背景色の実装
```typescript
// タップ可能要素
<TouchableOpacity
  style={{
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
  }}
>

// 情報表示要素
<View
  style={{
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
  }}
>
```

### デザインシステムドキュメントの更新

**追加したセクション**:
1. **統一ヘッダーデザイン仕様（セクション12）**
   - 基本構造とスタイル定義
   - StatusBar設定
   - 適用例外の明記

2. **ボックス背景色ルール（セクション13）**
   - 機能別背景色ルール
   - 実装例とUX向上の理由
   - 視覚的区別の重要性

### 現在の開発状況（Week 5+ UI統一完了時点）

#### ✅ 完了済み機能
1. **認証機能**: Apple ID、Google、テスト認証
2. **プロフィール管理**: 作成・編集機能
3. **車両管理**: 完全なCRUD操作
4. **点呼記録**: 業務前・業務後の記録機能
5. **ホーム画面**: 今日の状況表示とナビゲーション
6. **設定画面**: 3タブ構成（プロフィール・車両・その他）
7. **記録一覧画面**: 月別カレンダー表示、運行なし日設定
8. **PDF出力機能**: 週単位での点呼記録簿生成・共有
9. **UI/UXデザイン統一**: ヘッダー・背景色・間隔の標準化

#### 🎨 UI/UXの改善点
- **統一感向上**: 全ページで一貫したヘッダーデザイン
- **操作性向上**: 機能別背景色による直感的なUI
- **視認性向上**: 適切な余白と間隔の調整
- **ブランド統一**: delilogアーシーカラーパレットの徹底適用

### 技術スタック（最終確定）
```json
{
  "expo": "~52.0.11",
  "expo-router": "3.5.18",
  "react": "18.3.1",
  "react-native": "0.79.4",
  "@supabase/supabase-js": "^2.39.3",
  "zustand": "^4.4.7",
  "react-hook-form": "^7.48.2",
  "zod": "^3.22.4",
  "expo-sharing": "^12.0.1",
  "expo-print": "^13.0.1"
}
```

### Week 6への引き継ぎ事項

1. **機能追加**: 追加要件があれば対応
2. **パフォーマンス最適化**: 大量データ処理の改善
3. **テスト強化**: ユニットテスト・E2Eテストの追加
4. **ドキュメント整備**: ユーザーマニュアル・API仕様書
5. **リリース準備**: App Store/Google Playストア申請準備

## 開発原則の遵守

`DEVELOPMENT_PRINCIPLES.md`に記載の原則を必ず守ること：
1. セクション終了時に必ず開発を停止
2. セクション開始時に要件定義を参照