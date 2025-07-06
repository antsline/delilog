# 運送業点呼記録アプリ - デザインシステム定義

## 概要

運送業界向けの点呼記録アプリのデザインシステム。アーシーで洗練されたカラーパレットを基調とし、信頼感と温かみを両立したミニマルデザイン。

## カラーパレット

### プライマリカラー

```css
--cream: #fffcf2 /* メイン背景色 */ --charcoal: #252422 /* メインテキスト、重要なUI要素 */
  --dark-gray: #403d39 /* セカンダリテキスト、アイコン */ --beige: #ccc5b9 /* ボーダー、サブ背景 */
  --orange: #eb5e28 /* アクセントカラー、アラート */;
```

### 使用例

- **背景**: `#FFFCF2` (cream)
- **メインテキスト**: `#252422` (charcoal)
- **サブテキスト**: `#403D39` (dark-gray)
- **ボーダー/区切り**: `#CCC5B9` (beige)
- **アクセント/警告**: `#EB5E28` (orange)

## タイポグラフィ

### フォントファミリー

```css
font-family:
  'Noto Sans JP',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

### フォントウェイト

- **通常**: 400 (font-normal)
- **中**: 500 (font-medium)
- **太字**: 700 (font-bold)
- **極太**: 900 (font-black)

### フォントサイズ階層

- **大見出し**: 30px (text-3xl) - メインタイトル用
- **中見出し**: 18px (text-lg) - セクションタイトル用
- **小見出し**: 14px (text-sm) - サブタイトル用
- **キャプション**: 12px (text-xs) - 補足情報用
- **本文**: 16px (text-base) - 標準テキスト

## コンポーネント設計

### 1. ヘッダー

```
- 固定ポジション (fixed top-0)
- 背景: cream (#FFFCF2)
- ボーダー: beige (#CCC5B9)
- アバター: 48px円形、beige背景
- 名前: 18px bold charcoal
- 会社名: 14px medium dark-gray
```

### 2. カード

```
基本カード:
- 背景: cream (#FFFCF2)
- ボーダー: 1px solid beige (#CCC5B9)
- 角丸: 12px (rounded-xl)
- パディング: 16px
- シャドウ: 軽微 (shadow-sm)

ダークカード:
- 背景: charcoal (#252422) または dark-gray (#403D39)
- テキスト: white
- アイコン背景: cream (#FFFCF2)
```

### 3. ボタン

```
プライマリボタン:
- 背景: charcoal (#252422)
- テキスト: white
- 角丸: 16px (rounded-2xl)
- パディング: 16px vertical
- ホバー: transform scale(1.02)

セカンダリボタン:
- 背景: beige (#CCC5B9)
- テキスト: charcoal (#252422)
- 角丸: 16px
```

### 4. ステータス表示

```
完了: orange (#EB5E28)
進行中: dark-gray (#403D39)
予定: beige (#CCC5B9)
```

### 5. タブバー

```
- 固定ポジション (fixed bottom-0)
- 背景: cream (#FFFCF2)
- ボーダー: beige (#CCC5B9)
- アクティブ: charcoal (#252422), stroke-2
- 非アクティブ: dark-gray (#403D39), stroke-1
```

## レイアウト原則

### グリッドシステム

- **最大幅**: 384px (max-w-sm)
- **パディング**: 16px (px-4)
- **マージン**: 24px (mb-6) セクション間

### 余白ルール

- **コンポーネント間**: 24px
- **セクション内**: 16px
- **要素間**: 12px
- **テキスト行間**: 8px

### 角丸ルール

- **カード**: 12px (rounded-xl)
- **ボタン**: 16px (rounded-2xl)
- **小要素**: 8px (rounded-lg)
- **アバター/アイコン**: 50% (rounded-full)

## アニメーション

### トランジション

```css
transition: all 0.2s ease-in-out;
```

### ホバー効果

```css
/* ボタン */
hover:scale-[1.02]
hover:shadow-xl

/* リスト項目 */
hover:bg-opacity-80
```

## アイコン

### ライブラリ

- **Lucide React** を使用
- ストロークウィズ: 1.5px (デフォルト)
- アクティブ時: 2px (stroke-2)

### サイズ

- **標準**: 24px (w-6 h-6)
- **小**: 20px (w-5 h-5)
- **極小**: 16px (w-4 h-4)

## 実装上の注意点

### CSS変数の定義

```css
:root {
  --color-cream: #fffcf2;
  --color-charcoal: #252422;
  --color-dark-gray: #403d39;
  --color-beige: #ccc5b9;
  --color-orange: #eb5e28;
}
```

### TailwindCSS設定

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        cream: '#FFFCF2',
        charcoal: '#252422',
        'dark-gray': '#403D39',
        beige: '#CCC5B9',
        orange: '#EB5E28',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### React実装例

```jsx
// スタイル用のヘルパーオブジェクト
const colors = {
  cream: '#FFFCF2',
  charcoal: '#252422',
  darkGray: '#403D39',
  beige: '#CCC5B9',
  orange: '#EB5E28'
};

// インラインスタイル例
style={{
  backgroundColor: colors.cream,
  color: colors.charcoal,
  borderColor: colors.beige
}}
```

## コンポーネント階層

1. **Layout Components**
   - Header (固定ヘッダー)
   - TabBar (ボトムナビ)
   - Container (メインコンテナ)

2. **UI Components**
   - Card (各種カード)
   - Button (ボタン類)
   - StatusIndicator (ステータス表示)
   - ListItem (リスト項目)

3. **Feature Components**
   - ScheduleCard (スケジュール表示)
   - StatCard (統計カード)
   - QuickAction (クイックアクション)

## Claude Code 使用時の指示例

以下のようにClaude Codeに指示してください：

```
上記のデザインシステム定義に従って、運送業の点呼記録アプリを実装してください。

技術要件:
- React + TypeScript
- TailwindCSS (カスタム色設定済み)
- Lucide React (アイコン)
- Noto Sans JP (フォント)

実装すべき画面:
1. ホーム画面 (点呼状況、統計)
2. 記録画面 (点呼履歴)
3. PDF画面 (レポート)
4. 設定画面

デザイン要件:
- アーシーカラーパレット使用
- ミニマルで信頼感のあるデザイン
- モバイルファースト
- アクセシブルなコントラスト比
```
