# delilog UI/UXデザインシステム

> **重要**: このドキュメントは技術的な実装ガイドラインを記載しています。  
> **メインのデザインシステム**: `delilog-ui-design-system.md` を参照してください。

## 1. デザイン原則

### 1.1 基本理念

- **効率性**: 最小限のタップで作業完了
- **視認性**: 運転前後の疲れた状態でも見やすい
- **信頼性**: エラーを防ぎ、安心して使える
- **一貫性**: 統一された操作感

### 1.2 ターゲットユーザー考慮事項

- 屋外での使用（明るい場所でも見やすい）
- 片手操作が基本
- 短時間での入力完了
- ミスタップを防ぐ余裕のあるレイアウト

## 2. カラーパレット

> **注意**: 以下は旧カラーパレットです。新しいアーシーカラーパレットは `delilog-ui-design-system.md` を参照してください。

### 2.1 メインカラー（旧仕様 - 非推奨）

```scss
// 以下は旧仕様です。新しいアーシーカラーパレットを使用してください
// 新カラーパレット: cream, charcoal, dark-gray, beige, orange

// Primary - 信頼と安全を表すブルー（旧）
$primary-50: #eff6ff;
$primary-100: #dbeafe;
$primary-200: #bfdbfe;
$primary-300: #93c5fd;
$primary-400: #60a5fa;
$primary-500: #3b82f6;
$primary-600: #2563eb; // メインカラー
$primary-700: #1d4ed8;
$primary-800: #1e40af;
$primary-900: #1e3a8a;

// Secondary - アクセントカラー（旧）
$secondary-500: #8b5cf6;
$secondary-600: #7c3aed;
$secondary-700: #6d28d9;

// Semantic Colors（旧）
$success-500: #10b981; // 完了・成功
$warning-500: #f59e0b; // 警告・注意
$error-500: #ef4444; // エラー・削除
$info-500: #3b82f6; // 情報

// Neutral - グレースケール（旧）
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;
```

### 2.2 新カラーパレット（推奨）

```scss
// 新しいアーシーカラーパレット - delilog-ui-design-system.md準拠
$cream: #fffcf2; // メイン背景色
$charcoal: #252422; // メインテキスト、重要なUI要素
$dark-gray: #403d39; // セカンダリテキスト、アイコン
$beige: #ccc5b9; // ボーダー、サブ背景
$orange: #eb5e28; // アクセントカラー、アラート
```

### 2.3 用途別カラー使用例（新カラーパレット推奨）

- **背景**: $cream (#FFFCF2)
- **カード背景**: $cream (#FFFCF2)
- **テキスト（主）**: $charcoal (#252422)
- **テキスト（副）**: $dark-gray (#403D39)
- **ボーダー**: $beige (#CCC5B9)
- **アクセント/警告**: $orange (#EB5E28)

### 2.4 用途別カラー使用例（旧仕様）

- **背景**: $gray-50（ライトモード）/ $gray-900（ダークモード）
- **カード背景**: white / $gray-800
- **テキスト（主）**: $gray-900 / $gray-50
- **テキスト（副）**: $gray-600 / $gray-400
- **ボーダー**: $gray-200 / $gray-700
- **無効状態**: $gray-300 / $gray-600

## 3. タイポグラフィ

### 3.1 フォントファミリー（新仕様推奨）

```scss
// 新しいフォントファミリー - delilog-ui-design-system.md準拠
$font-family-base:
  'Noto Sans JP',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

### 3.2 フォントファミリー（旧仕様）

```scss
// iOS
$font-family-ios: -apple-system, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN';

// Android
$font-family-android: 'Roboto', 'Noto Sans JP';

// 共通フォールバック
$font-family-base: $font-family-ios, $font-family-android, sans-serif;
```

### 3.3 フォントサイズ（新仕様推奨）

```scss
// 新しいフォントサイズ階層 - delilog-ui-design-system.md準拠
$text-xs: 12px; // キャプション - 補足情報用
$text-sm: 14px; // 小見出し - サブタイトル用
$text-base: 16px; // 本文 - 標準テキスト
$text-lg: 18px; // 中見出し - セクションタイトル用
$text-3xl: 30px; // 大見出し - メインタイトル用
```

### 3.4 フォントサイズ（旧仕様）

```scss
$text-xs: 12px; // 補助テキスト
$text-sm: 14px; // 小見出し、ラベル
$text-base: 16px; // 本文（基準）
$text-lg: 18px; // 見出し
$text-xl: 20px; // 大見出し
$text-2xl: 24px; // ページタイトル
$text-3xl: 30px; // 特大タイトル
```

### 3.5 フォントウェイト（新仕様推奨）

```scss
// 新しいフォントウェイト - delilog-ui-design-system.md準拠
$font-normal: 400; // 通常テキスト
$font-medium: 500; // 中
$font-bold: 700; // 太字
$font-black: 900; // 極太
```

### 3.6 フォントウェイト（旧仕様）

```scss
$font-normal: 400; // 通常テキスト
$font-medium: 500; // 強調テキスト
$font-semibold: 600; // 見出し
$font-bold: 700; // 重要な見出し
```

### 3.7 行間（Line Height）

```scss
$leading-tight: 1.25; // 見出し
$leading-normal: 1.5; // 本文
$leading-relaxed: 1.75; // ゆったり本文
```

## 4. スペーシング

### 4.1 基本単位（4pxグリッド）

```scss
$space-0: 0; // 0px
$space-1: 4px; // 極小
$space-2: 8px; // 小
$space-3: 12px; //
$space-4: 16px; // 標準
$space-5: 20px;
$space-6: 24px; // 大
$space-8: 32px; // 特大
$space-10: 40px;
$space-12: 48px; // 超特大
$space-16: 64px;
$space-20: 80px; // 最大
```

### 4.2 使用ガイドライン

- **要素間の最小間隔**: $space-2 (8px)
- **関連要素のグループ化**: $space-4 (16px)
- **セクション間**: $space-8 (32px)
- **画面の左右パディング**: $space-4 (16px)

## 5. コンポーネントパターン

### 5.1 ボタン

#### サイズ

```scss
// Small
height: 36px;
padding: 0 12px;
font-size: 14px;

// Medium（デフォルト）
height: 44px; // タップターゲット最小サイズ
padding: 0 16px;
font-size: 16px;

// Large
height: 52px;
padding: 0 24px;
font-size: 18px;
```

#### バリアント

```scss
// Primary
background: $primary-600;
color: white;
&:active {
  background: $primary-700;
}

// Secondary
background: $gray-100;
color: $gray-700;
border: 1px solid $gray-300;
&:active {
  background: $gray-200;
}

// Danger
background: $error-500;
color: white;
&:active {
  background: $error-600;
}

// Ghost
background: transparent;
color: $primary-600;
&:active {
  background: $gray-100;
}
```

### 5.2 入力フィールド

```scss
// 基本スタイル
.input {
  height: 44px; // タップしやすいサイズ
  padding: 0 16px;
  font-size: 16px;
  border: 1px solid $gray-300;
  border-radius: 8px;
  background: white;

  &:focus {
    border-color: $primary-500;
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
  }

  &.error {
    border-color: $error-500;
  }
}

// ラベル
.label {
  font-size: 14px;
  font-weight: 500;
  color: $gray-700;
  margin-bottom: 4px;
}

// エラーメッセージ
.error-message {
  font-size: 12px;
  color: $error-500;
  margin-top: 4px;
}
```

### 5.3 カード

```scss
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  // 押せるカード
  &.pressable {
    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
}
```

### 5.4 リスト項目

```scss
.list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  min-height: 60px;

  &:not(:last-child) {
    border-bottom: 1px solid $gray-100;
  }

  .icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    color: $gray-500;
  }

  .content {
    flex: 1;
  }

  .arrow {
    color: $gray-400;
  }
}
```

## 6. アイコン

### 6.1 アイコンサイズ

```scss
$icon-xs: 16px; // インライン
$icon-sm: 20px; // 小
$icon-md: 24px; // 標準
$icon-lg: 32px; // 大
$icon-xl: 48px; // 特大
```

### 6.2 使用アイコン（Lucide React Native）

- **ナビゲーション**: Home, FileText, Settings
- **アクション**: Plus, Edit, Trash, Check, X
- **状態**: CheckCircle, AlertCircle, Info, XCircle
- **その他**: Calendar, Clock, Car, FileDown, Share

## 7. アニメーション

### 7.1 トランジション

```scss
$transition-fast: 150ms ease-in-out; // ホバー、フォーカス
$transition-base: 250ms ease-in-out; // 一般的な遷移
$transition-slow: 350ms ease-in-out; // モーダル、画面遷移
```

### 7.2 React Native Animated 使用例

```typescript
// フェードイン
const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 250,
  easing: Easing.ease,
};

// スライドアップ
const slideUp = {
  from: { translateY: 20, opacity: 0 },
  to: { translateY: 0, opacity: 1 },
  duration: 350,
  easing: Easing.out(Easing.cubic),
};
```

## 8. レイアウトパターン

### 8.1 画面構成

```
┌─────────────────────────┐
│     Status Bar          │
├─────────────────────────┤
│     Header (44px)       │
├─────────────────────────┤
│                         │
│     Content Area        │
│     (scrollable)        │
│                         │
├─────────────────────────┤
│   Tab Bar (49px)        │
└─────────────────────────┘
```

### 8.2 グリッドシステム

- **カラム**: 4列グリッド（モバイル）
- **ガター**: 16px
- **マージン**: 16px

### 8.3 カード配置

```scss
// 縦スクロールリスト
.card-list {
  .card + .card {
    margin-top: 12px;
  }
}

// グリッド配置（iPad対応）
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}
```

## 9. アクセシビリティ

### 9.1 カラーコントラスト

- **通常テキスト**: 4.5:1 以上
- **大きいテキスト(18px+)**: 3:1 以上
- **アクティブUI要素**: 3:1 以上

### 9.2 タップターゲット

- **最小サイズ**: 44x44px
- **推奨サイズ**: 48x48px
- **間隔**: 最低8px

### 9.3 アクセシビリティ属性

```typescript
// React Native
<TouchableOpacity
  accessible={true}
  accessibilityLabel="業務前点呼を開始"
  accessibilityHint="タップして業務前の点呼記録を開始します"
  accessibilityRole="button"
>
```

## 10. プラットフォーム別考慮事項

### 10.1 iOS

- セーフエリアの考慮（notch, home indicator）
- iOS標準のジェスチャーとの競合回避
- SF Symbolsの活用

### 10.2 Android

- マテリアルデザインとの調和
- バックボタンの考慮
- エレベーション（影）の実装

### 10.3 レスポンシブ対応

```typescript
// デバイスサイズによる分岐
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = {
  container: {
    padding: isTablet ? 24 : 16,
  },
  cardWidth: {
    width: isTablet ? '48%' : '100%',
  },
};
```

## 11. ダークモード対応

### 11.1 カラースキーム

```typescript
const colors = {
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
  },
};
```

### 11.2 実装例

```typescript
import { useColorScheme } from 'react-native';

const scheme = useColorScheme();
const colors = scheme === 'dark' ? colors.dark : colors.light;
```

---

## 重要なお知らせ

**新しいデザインシステムが適用されました！**

このドキュメントは技術的な実装ガイドラインとして残されていますが、デザインの基本方針は以下のドキュメントに移行されました：

📋 **メインデザインシステム**: [`delilog-ui-design-system.md`](./delilog-ui-design-system.md)

### 新デザインシステムの特徴

- **アーシーカラーパレット**: cream, charcoal, dark-gray, beige, orange
- **ミニマルデザイン**: 信頼感と温かみを両立
- **モバイルファースト**: 最大幅384px、16pxパディング
- **Noto Sans JP**: 統一されたフォントファミリー

### 開発時の注意点

1. 新しいコンポーネントは `delilog-ui-design-system.md` の仕様に従って実装
2. 既存コンポーネントも段階的に新デザインシステムに移行
3. カラーパレットは新仕様（cream, charcoal等）を優先使用
4. 技術的な実装詳細は本ドキュメントを参照
