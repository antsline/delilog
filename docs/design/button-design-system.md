# ボタンデザインシステム

## ホーム画面アクションボタン

### 新デザイン仕様（業務前点呼ボタンベース）

**サイズ**
- height: 160px
- width: 100%（flex: 1で親コンテナに合わせる）
- padding: 20px
- borderRadius: 16px

**アイコン配置**
- position: absolute
- top: 0 (パディング内基準)
- left: -4px (パディング境界から4px左)
- size: 24px

**テキスト配置**
- justifyContent: 'flex-end' (ボトム配置)
- paddingBottom: 6px
- タイトルフォントサイズ: 18px
- サブタイトルフォントサイズ: 12px

**レイアウト構造**
```tsx
<TouchableOpacity style={styles.actionButton}>
  <View style={styles.actionButtonContent}>
    <Feather 
      name="icon-name" 
      size={24} 
      style={styles.actionButtonIconTopLeft}
    />
    <View style={styles.actionButtonTextContainer}>
      <Text style={styles.actionButtonTitleLarge}>タイトル</Text>
      <Text style={styles.actionButtonSubtitle}>サブタイトル</Text>
    </View>
  </View>
</TouchableOpacity>
```

**スタイル定義**
```tsx
actionButton: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  alignItems: 'center',
  borderWidth: 2,
  borderColor: colors.beige,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
  height: 160,
  width: '100%',
  justifyContent: 'center',
},

actionButtonContent: {
  flex: 1,
  width: '100%',
  height: '100%',
  position: 'relative',
  justifyContent: 'flex-end',
  paddingBottom: 6,
},

actionButtonIconTopLeft: {
  position: 'absolute',
  top: 0,
  left: -4,
},

actionButtonTextContainer: {
  alignItems: 'center',
  justifyContent: 'center',
},

actionButtonTitleLarge: {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.charcoal,
  marginBottom: 4,
  textAlign: 'center',
},
```

## 適用対象ボタン

1. **業務前点呼** ✅ 実装済み
   - アイコン: truck / check-circle
   - 完了状態でオレンジ色表示

2. **業務後点呼** 
   - アイコン: clipboard / check-circle
   - 業務前点呼完了後に有効化

3. **日常点検**
   - アイコン: tool
   - 無効化状態（グレーアウト）

4. **運行記録**
   - アイコン: map
   - 無効化状態（グレーアウト）

## 状態別スタイル

**完了状態**
- borderColor: colors.orange
- backgroundColor: colors.orange + '10'
- テキスト色: colors.orange

**無効化状態**
- backgroundColor: colors.beige + '40'
- borderColor: colors.darkGray
- opacity: 0.6
- アイコン・テキスト色: colors.darkGray

## 実装日

2025年7月23日 - 業務前点呼ボタンでデザイン確定