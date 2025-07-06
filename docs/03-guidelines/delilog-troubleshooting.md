# delilog トラブルシューティングガイド

## 1. 開発環境のトラブル

### 1.1 Expo関連

#### Metro bundlerが起動しない

```bash
# 症状
Error: Unable to resolve module

# 解決策
# 1. キャッシュクリア
npx expo start -c

# 2. node_modules再インストール
rm -rf node_modules
npm install # or yarn install

# 3. watchmanリセット（macOS）
watchman watch-del-all
```

#### iOS Simulatorが起動しない

```bash
# 症状
Simulator not responding

# 解決策
# 1. Xcodeの再起動
# 2. Simulatorのリセット
xcrun simctl erase all

# 3. Xcode Command Line Tools再インストール
xcode-select --install
```

#### EAS Buildエラー

```bash
# 症状
Build failed on EAS

# 解決策
# 1. eas.jsonの確認
{
  "build": {
    "production": {
      "node": "18.18.0",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-url"
      }
    }
  }
}

# 2. 証明書の再生成
eas credentials
```

### 1.2 TypeScript関連

#### 型エラーが解決しない

```typescript
// 症状
Type 'unknown' is not assignable to type 'User'

// 解決策
// 1. 型定義の再生成
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts

// 2. tsconfig.jsonの確認
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true
  }
}

// 3. 型ガードの使用
const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && value !== null && 'id' in value;
};
```

#### パスエイリアスが機能しない

```json
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
          },
        },
      ],
    ],
  };
};
```

### 1.3 React Native関連

#### ネイティブモジュールエラー

```bash
# 症状
Native module cannot be null

# 解決策
# 1. prebuildの実行
npx expo prebuild --clean

# 2. iOS podsの再インストール
cd ios && pod install

# 3. キャッシュクリア
cd android && ./gradlew clean
```

#### アニメーションがカクつく

```typescript
// 症状
Animation is janky

// 解決策
// 1. useNativeDriverの使用
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // 重要！
}).start();

// 2. InteractionManagerの使用
InteractionManager.runAfterInteractions(() => {
  // 重い処理
});

// 3. メモ化
const MemoizedComponent = React.memo(HeavyComponent);
```

## 2. Supabase関連のトラブル

### 2.1 認証エラー

#### ログインできない

```typescript
// 症状
Invalid login credentials

// 解決策
// 1. Supabase Dashboardで認証設定確認
// - Email認証が有効か
// - OAuth providerが設定されているか

// 2. 正しいエンドポイントの使用
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  if (error.message.includes('Invalid login')) {
    // パスワードリセットを促す
  }
}
```

#### セッションが保持されない

```typescript
// 症状
User is logged out after app restart

// 解決策
// 1. セッション復元の実装
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser(session.user);
    }
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

### 2.2 データベースエラー

#### RLSポリシーエラー

```sql
-- 症状
new row violates row-level security policy

-- 解決策
-- 1. ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- 2. 適切なポリシーの追加
CREATE POLICY "Users can insert own records" ON tenko_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. サービスロールキーの使用（開発時のみ）
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

#### データ取得できない

```typescript
// 症状
Data is null even though it exists

// 解決策
// 1. selectの明示的な指定
const { data, error } = await supabase
  .from('tenko_records')
  .select('*, vehicles(*)') // 関連データも取得
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// 2. 型の明示的な指定
const { data, error } = await supabase
  .from('tenko_records')
  .select()
  .returns<TenkoRecord[]>();
```

### 2.3 リアルタイム接続

#### リアルタイム更新が届かない

```typescript
// 症状
Realtime subscription not working

// 解決策
// 1. チャンネルの正しい設定
const channel = supabase
  .channel('tenko-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tenko_records',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// 2. クリーンアップ
return () => {
  supabase.removeChannel(channel);
};
```

## 3. PDF生成のトラブル

### 3.1 日本語文字化け

```typescript
// 症状
Japanese characters show as squares

// 解決策
// 1. フォントの埋め込み
import * as FileSystem from 'expo-file-system';

const fontUrl = 'https://example.com/NotoSansJP-Regular.ttf';
const fontPath = FileSystem.documentDirectory + 'NotoSansJP.ttf';

await FileSystem.downloadAsync(fontUrl, fontPath);

// 2. react-native-pdfでフォント指定
const styles = StyleSheet.create({
  text: {
    fontFamily: 'NotoSansJP',
  },
});
```

### 3.2 レイアウト崩れ

```typescript
// 症状
PDF layout is broken

// 解決策
// 1. 固定幅の使用
<View style={{ width: 595, height: 842 }}> // A4サイズ
  {/* content */}
</View>

// 2. 絶対位置指定
<Text style={{
  position: 'absolute',
  top: 100,
  left: 50,
}}>
  固定位置のテキスト
</Text>
```

## 4. パフォーマンスの問題

### 4.1 起動が遅い

```typescript
// 症状
App takes more than 3 seconds to start

// 解決策
// 1. 遅延読み込み
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 2. スプラッシュスクリーンの延長
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// アプリの準備完了後
await SplashScreen.hideAsync();

// 3. 初期データの最小化
// 必要最小限のデータのみ初期ロード
```

### 4.2 メモリリーク

```typescript
// 症状
Memory usage keeps increasing

// 解決策
// 1. イベントリスナーのクリーンアップ
useEffect(() => {
  const subscription = someEvent.subscribe(handler);

  return () => {
    subscription.unsubscribe();
  };
}, []);

// 2. タイマーのクリア
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);

  return () => {
    clearTimeout(timer);
  };
}, []);

// 3. 大きな画像の最適化
import { Image } from 'react-native';

Image.getSize(uri, (width, height) => {
  if (width > 1000) {
    // リサイズ処理
  }
});
```

## 5. ストア/審査関連

### 5.1 App Store審査リジェクト

#### ガイドライン2.1 - パフォーマンス

```
症状: App completeness

解決策:
1. すべての機能が動作することを確認
2. プレースホルダーテキストを削除
3. エラー画面を実装
4. 読み込み中の表示を追加
```

#### ガイドライン3.1.1 - In-App Purchase

```
症状: App内課金の実装が必要

解決策:
1. デジタルコンテンツにはApp内課金を使用
2. 外部決済への誘導を削除
3. 価格を明確に表示
```

#### ガイドライン5.1.1 - データ収集とストレージ

```
症状: プライバシーポリシーが不適切

解決策:
1. 収集するデータを明確に記載
2. データの使用目的を説明
3. 第三者との共有について記載
4. App Privacy情報と一致させる
```

### 5.2 Google Play審査リジェクト

#### ポリシー違反: 権限の過剰な要求

```
症状: 不要な権限を要求している

解決策:
1. AndroidManifest.xmlを確認
2. 使用していない権限を削除
3. 権限の使用理由を明確に
```

## 6. よくある実装ミス

### 6.1 非同期処理の扱い

```typescript
// ❌ 悪い例
const fetchData = async () => {
  const data = await api.getData();
  setData(data); // コンポーネントがアンマウントされているかも
};

// ✅ 良い例
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    const data = await api.getData();
    if (isMounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

### 6.2 条件付きフックの使用

```typescript
// ❌ 悪い例
if (condition) {
  useEffect(() => {}, []); // エラー！
}

// ✅ 良い例
useEffect(() => {
  if (condition) {
    // 処理
  }
}, [condition]);
```

### 6.3 キー漏れ

```typescript
// ❌ 悪い例
{items.map(item => (
  <ItemComponent item={item} />
))}

// ✅ 良い例
{items.map(item => (
  <ItemComponent key={item.id} item={item} />
))}
```

## 7. デバッグTips

### 7.1 React Native Debugger

```bash
# インストール
brew install react-native-debugger

# 使用方法
1. React Native Debuggerを起動
2. アプリでRemote Debugを有効化
3. Network, Redux, Componentsタブを活用
```

### 7.2 Flipper

```typescript
// ネットワークリクエストの確認
// Reactコンポーネントツリーの確認
// パフォーマンスプロファイリング
```

### 7.3 カスタムログ

```typescript
// utils/logger.ts
export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // Sentryに送信
  },
};
```

## 8. 緊急対応フロー

### 8.1 本番環境でのクラッシュ

1. Sentryでエラーログ確認
2. 影響範囲の特定
3. ホットフィックスの作成
4. TestFlightで緊急テスト
5. 緊急アップデート申請

### 8.2 データ不整合

1. 影響を受けたユーザーの特定
2. バックアップからのリストア検討
3. 手動でのデータ修正
4. 再発防止策の実装

---

## サポート連絡先

**開発に関する質問**

- GitHub Issues: [リポジトリURL]
- Discord: [招待リンク]

**緊急時の連絡**

- Email: emergency@delilog.jp
- Slack: #delilog-urgent
