# RevenueCat 設定手順（クイックガイド）

delilogアプリのサブスクリプション機能を有効にするための必須設定手順です。

## 🚀 必須設定手順

### ステップ1: RevenueCatアカウント作成
1. [RevenueCat](https://www.revenuecat.com/)で無料アカウント作成
2. プロジェクト作成: `delilog`

### ステップ2: アプリ登録
```
iOS アプリ:
- Bundle ID: jp.delilog.app
- プラットフォーム: iOS

Android アプリ:
- Package Name: jp.delilog.app  
- プラットフォーム: Android
```

### ステップ3: 商品作成
```
Product ID: delilog_monthly_900
Type: Subscription
Price: ¥900/月
Trial: 7日間無料
```

### ステップ4: Entitlement作成
```
Identifier: delilog_premium
Name: プレミアム機能
Products: delilog_monthly_900を関連付け
```

### ステップ5: APIキー取得
RevenueCatダッシュボードの「API keys」から取得:

```
iOS: appl_xxxxxxxxxx
Android: goog_xxxxxxxxxx
```

### ステップ6: .envファイル更新
`/Users/narajunichi/delilog/.env`ファイルの以下の値を更新:

```bash
# RevenueCat設定 - 実際のAPIキーに置き換えてください
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_actual_ios_api_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_actual_android_api_key
```

## 🛍️ ストア設定（本番リリース時）

### App Store Connect
1. 自動更新サブスクリプション作成
2. Product ID: `delilog_monthly_900`
3. 価格: ¥900
4. 無料トライアル: 7日間

### Google Play Console  
1. 定期購入商品作成
2. Product ID: `delilog_monthly_900`
3. 価格: ¥900
4. 無料トライアル: 7日間

## ✅ 設定確認

### 開発環境での確認
```bash
# アプリ起動
npm start

# サブスクリプション画面で確認事項:
# ✓ 料金プランが表示される
# ✓ 「購入する」ボタンが動作する  
# ✓ エラーが発生しない
```

### ログでの確認
```
✅ RevenueCat initialized successfully
✅ Available packages loaded
✅ Subscription status checked
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. APIキーエラー
```
エラー: RevenueCat initialization failed
解決: .envファイルのAPIキーが正しいか確認
```

#### 2. 商品が表示されない
```
エラー: No available packages found
解決: RevenueCatで商品とEntitlementの関連付けを確認
```

#### 3. 購入が失敗する
```
エラー: Purchase failed
解決: App Store Connect/Google Play Consoleで商品ステータス確認
```

## 📝 設定完了チェックリスト

- [ ] RevenueCatアカウント作成
- [ ] iOS/Androidアプリ登録  
- [ ] 商品作成 (delilog_monthly_900)
- [ ] Entitlement作成 (delilog_premium)
- [ ] APIキー取得
- [ ] .envファイル更新
- [ ] アプリでの動作確認

## 🎯 次のステップ

設定完了後:
1. **開発段階**: サンドボックス環境でのテスト
2. **本番前**: App Store/Google Play での商品設定
3. **リリース**: 実際の課金テスト

---

**重要**: 実際のAPIキーは他人に共有しないでください。Gitにコミットする際は.envファイルが.gitignoreに含まれていることを確認してください。