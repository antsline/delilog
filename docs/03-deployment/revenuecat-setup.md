# RevenueCat設定ガイド

delilogアプリのサブスクリプション機能を有効にするために、RevenueCatの設定が必要です。

## 1. RevenueCatアカウント作成

### 1.1 アカウント登録
1. [RevenueCat](https://www.revenuecat.com/)にアクセス
2. 「Get Started for Free」をクリック
3. アカウント情報を入力して登録

### 1.2 プロジェクト作成
1. ダッシュボードで「Create new project」
2. プロジェクト名: `delilog`
3. アプリ名: `デリログ`

## 2. アプリ設定

### 2.1 iOSアプリ設定
1. RevenueCatダッシュボードの左サイドバーで「Project settings」をクリック
2. または、プロジェクト作成時に表示される「Add your first app」をクリック
3. 「Add app」ボタンをクリック
4. プラットフォーム: iOS
5. アプリ名: `delilog iOS`
6. Bundle ID: `jp.delilog.app` (実際のBundle IDに変更)
7. 「Add App」をクリック

### 2.2 Androidアプリ設定
1. 同様に「Add app」ボタンをクリック
2. プラットフォーム: Android
3. アプリ名: `delilog Android`
4. Package Name: `jp.delilog.app` (実際のPackage Nameに変更)
5. 「Add App」をクリック

> **注意**: RevenueCatのUIは定期的に更新されます。「Apps」タブが見つからない場合は、以下のいずれかを確認してください：
> - 左サイドバーの「Project settings」
> - ダッシュボード中央の「Add your first app」ボタン
> - 右上の「+ Add App」ボタン

## 3. 商品設定

### 3.1 商品作成
1. 左サイドバーの「Products」をクリック
2. 「Create Product」または「+ New Product」をクリック
3. Product ID: `delilog_monthly_980`
4. Type: Subscription
5. 名前: `デリログ プレミアム`
6. 説明: `全機能が使える月額プラン`

### 3.2 価格設定
```
日本: ¥980/月
米国: $6.99/月
その他地域: 適切なローカライズ価格
```

## 4. Entitlement設定

### 4.1 Entitlement作成
1. 左サイドバーの「Entitlements」をクリック
2. 「Create Entitlement」または「+ New Entitlement」をクリック
3. Identifier: `delilog_premium`
4. 名前: `プレミアム機能`
5. 説明: `デリログの全機能にアクセス`

### 4.2 商品の関連付け
1. 作成したEntitlementを選択
2. 「Attach Products」で`delilog_monthly_980`を追加

## 5. API キー取得

### 5.1 公開APIキー
1. 左サイドバーの「API Keys」をクリック
2. 「Public API keys」セクションを確認

#### iOS API Key
```
appl_xxxxxxxxxxxxxxxxx
```

#### Android API Key
```
goog_xxxxxxxxxxxxxxxxx
```

### 5.2 コードへの適用
`src/services/subscriptionService.ts`を更新:

```typescript
class SubscriptionService {
  private readonly API_KEY_IOS = 'appl_YOUR_ACTUAL_IOS_API_KEY';
  private readonly API_KEY_ANDROID = 'goog_YOUR_ACTUAL_ANDROID_API_KEY';
  private readonly ENTITLEMENT_ID = 'delilog_premium';
  private readonly PRODUCT_ID = 'delilog_monthly_980';
  // ...
}
```

## 6. App Store Connect設定

### 6.1 App Store Connectでの商品作成
1. App Store Connectにログイン
2. 「マイApp」→ アプリを選択
3. 「App内課金」→「管理」

### 6.2 自動更新サブスクリプション作成
```
商品ID: delilog_monthly_980
参照名: デリログ プレミアム
価格: ¥980
サブスクリプション期間: 1ヶ月
無料トライアル: 7日間
```

### 6.3 RevenueCatとの連携
1. RevenueCatダッシュボードの左サイドバーで「Project settings」をクリック
2. iOS アプリを選択
3. 「App Store Connect」セクション
4. App Store Connect APIキーを設定

## 7. Google Play Console設定

### 7.1 Google Play Consoleでの商品作成
1. Google Play Consoleにログイン
2. アプリを選択
3. 「収益化」→「商品」→「定期購入」

### 7.2 定期購入商品作成
```
商品ID: delilog_monthly_980
名前: デリログ プレミアム
説明: 全機能が使える月額プラン
価格: ¥980
請求期間: 1ヶ月
無料トライアル: 7日間
```

### 7.3 RevenueCatとの連携
1. RevenueCatダッシュボードの左サイドバーで「Project settings」をクリック
2. Android アプリを選択
3. 「Google Play Console」セクション
4. サービスアカウントキーをアップロード

## 8. テスト設定

### 8.1 サンドボックステスト（iOS）
1. RevenueCatの左サイドバーで「Customer Center」をクリック
2. 「Sandbox」環境を選択
3. テストユーザーを追加
4. iOS Simulatorでテスト

### 8.2 内部テスト（Android）
1. Google Play Consoleで内部テストトラックを設定
2. テストユーザーを追加
3. Androidエミュレーターでテスト

## 9. 本番環境への移行

### 9.1 App Store審査対応
1. App Store Connectで「審査用情報」を入力
2. サブスクリプションの説明を詳細に記載
3. 利用規約・プライバシーポリシーのURL追加

### 9.2 Google Play審査対応
1. アプリ内商品の詳細説明
2. スクリーンショットの更新
3. 定期購入に関する説明の追加

## 10. 監視とメンテナンス

### 10.1 RevenueCatダッシュボード監視
- 売上レポートの定期確認
- チャーン率の監視
- エラーログの確認

### 10.2 アプリ内課金のメンテナンス
- 価格の定期見直し
- プロモーション設定
- ユーザーフィードバックの反映

## トラブルシューティング

### よくある問題と解決方法

#### 1. 商品が取得できない
```
原因: App Store Connect/Google Play Consoleでの商品設定が不完全
解決: 商品のステータスが「準備完了」になっているか確認
```

#### 2. 購入が完了しない
```
原因: RevenueCatとストアの連携設定が不正
解決: API キーとサービスアカウント設定を再確認
```

#### 3. 復元が機能しない
```
原因: 同一Apple ID/Google アカウントでの購入履歴なし
解決: テスト環境での購入履歴を確認
```

## セキュリティ考慮事項

### 1. APIキーの管理
- 本番用APIキーは環境変数で管理
- 開発・ステージング・本番環境を分離
- APIキーの定期ローテーション

### 2. レシート検証
- RevenueCatによる自動検証を信頼
- サーバーサイドでの二重検証は不要
- 不正な課金回避の仕組みはRevenueCatが提供

## まとめ

RevenueCatの設定により、delilogアプリで以下が実現されます：

1. **簡単な課金実装**: 複雑なストア連携をRevenueCatが代行
2. **クロスプラットフォーム対応**: iOS・Android両方で統一された課金体験
3. **詳細な分析**: 売上・ユーザー行動の詳細分析
4. **自動化された処理**: 購入確認・復元・チャーン対策の自動化

設定完了後は、アプリ内でプレミアム機能への課金が正常に動作します。