# delilog コーディング規約・スタイルガイド

## 1. 命名規則

### 1.1 基本的な命名規則

- **コンポーネント**: PascalCase

  ```typescript
  // Good
  export const TenkoForm = () => { ... }
  export const VehicleSelector = () => { ... }

  // Bad
  export const tenkoForm = () => { ... }
  export const vehicle_selector = () => { ... }
  ```

- **関数**: camelCase

  ```typescript
  // Good
  const saveTenkoRecord = async () => { ... }
  const calculateDistance = () => { ... }

  // Bad
  const SaveTenkoRecord = async () => { ... }
  const calculate_distance = () => { ... }
  ```

- **定数**: UPPER_SNAKE_CASE

  ```typescript
  // Good
  const MAX_VEHICLES = 3;
  const API_TIMEOUT = 30000;

  // Bad
  const maxVehicles = 3;
  const apiTimeout = 30000;
  ```

- **ファイル名**: kebab-case

  ```
  // Good
  tenko-form.tsx
  use-auth.ts
  api-client.ts

  // Bad
  TenkoForm.tsx
  useAuth.ts
  apiClient.ts
  ```

### 1.2 特殊な命名規則

- **カスタムフック**: use〜で始まる

  ```typescript
  // Good
  export const useAuth = () => { ... }
  export const useTenkoRecords = () => { ... }
  ```

- **型定義**: PascalCase、末尾にType/Interface

  ```typescript
  // Good
  interface UserType { ... }
  type TenkoRecordType = { ... }
  ```

- **Enum**: PascalCase、値はUPPER_SNAKE_CASE
  ```typescript
  enum HealthStatus {
    GOOD = 'good',
    CAUTION = 'caution',
    POOR = 'poor',
  }
  ```

## 2. ディレクトリ構造

```
src/
├── app/                    # Expo Router画面
│   ├── (auth)/            # 認証関連画面
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/            # タブ画面
│   │   ├── index.tsx      # ホーム
│   │   ├── records.tsx    # 記録一覧
│   │   ├── settings.tsx   # 設定
│   │   └── _layout.tsx
│   └── _layout.tsx        # ルートレイアウト
├── components/
│   ├── ui/                # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── features/          # 機能固有コンポーネント
│       ├── tenko/
│       │   ├── TenkoForm.tsx
│       │   └── TenkoCard.tsx
│       └── vehicle/
│           └── VehicleSelector.tsx
├── hooks/                 # カスタムフック
│   ├── useAuth.ts
│   ├── useTenkoRecords.ts
│   └── useOfflineSync.ts
├── services/              # 外部サービス連携
│   ├── supabase.ts
│   ├── api-client.ts
│   └── pdf-generator.ts
├── store/                 # 状態管理（Zustand）
│   ├── authStore.ts
│   ├── tenkoStore.ts
│   └── vehicleStore.ts
├── types/                 # 型定義
│   ├── database.types.ts  # Supabase自動生成
│   ├── models.ts
│   └── api.ts
├── utils/                 # ユーティリティ関数
│   ├── date.ts
│   ├── validation.ts
│   └── format.ts
└── constants/             # 定数
    ├── config.ts
    └── messages.ts
```

## 3. コンポーネント設計原則

### 3.1 単一責任の原則

- 1コンポーネント = 1つの責任
- 50行を超えたら分割を検討
- ビジネスロジックとUIを分離

```typescript
// Good - 責任が分離されている
const TenkoForm = () => {
  const { saveTenkoRecord } = useTenkoRecords();
  return <Form onSubmit={saveTenkoRecord} />;
};

// Bad - UIとロジックが混在
const TenkoForm = () => {
  const handleSubmit = async (data) => {
    // 100行のビジネスロジック...
  };
  return <Form onSubmit={handleSubmit} />;
};
```

### 3.2 Props型定義

```typescript
// Good - 明確な型定義
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  ...props
}) => { ... };
```

### 3.3 コンポーネントの構成

```typescript
// 推奨される構成
export const ComponentName = () => {
  // 1. Hooks
  const { user } = useAuth();
  const [state, setState] = useState();

  // 2. 副作用
  useEffect(() => {
    // 処理
  }, []);

  // 3. ハンドラー関数
  const handlePress = () => { ... };

  // 4. 早期リターン（ローディング、エラーなど）
  if (loading) return <Loading />;
  if (error) return <Error />;

  // 5. メインのレンダリング
  return (
    <View>
      {/* JSX */}
    </View>
  );
};
```

## 4. TypeScript規約

### 4.1 型定義の基本

```typescript
// interfaceを優先（拡張可能な場合）
interface User {
  id: string;
  name: string;
}

// typeは合併型、交差型、ユーティリティ型で使用
type Status = 'active' | 'inactive';
type UserWithStatus = User & { status: Status };
```

### 4.2 nullableな値の扱い

```typescript
// Good - Optional Chainingを使用
const userName = user?.name ?? 'ゲスト';

// Bad - 冗長なチェック
const userName = user && user.name ? user.name : 'ゲスト';
```

### 4.3 型アサーションの制限

```typescript
// Good - 型ガードを使用
const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && value !== null && 'id' in value;
};

// Bad - 安易な型アサーション
const user = response.data as User;
```

## 5. React Native / Expo 固有の規約

### 5.1 スタイリング

```typescript
// NativeWindを使用（Tailwind CSS）
import { View, Text } from 'react-native';

// Good
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">
    タイトル
  </Text>
</View>

// Bad - インラインスタイル
<View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
    タイトル
  </Text>
</View>
```

### 5.2 プラットフォーム固有のコード

```typescript
import { Platform } from 'react-native';

// Good
const styles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
    },
    android: {
      elevation: 4,
    },
  }),
};
```

## 6. 非同期処理とエラーハンドリング

### 6.1 async/awaitの使用

```typescript
// Good
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.getTenkoRecords();
    setRecords(data);
  } catch (error) {
    console.error('データ取得エラー:', error);
    showError('データの取得に失敗しました');
  } finally {
    setLoading(false);
  }
};

// Bad - Promiseチェーン
const fetchData = () => {
  api
    .getTenkoRecords()
    .then((data) => setRecords(data))
    .catch((error) => console.error(error));
};
```

### 6.2 カスタムエラークラス

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## 7. 状態管理（Zustand）

### 7.1 Storeの構成

```typescript
interface TenkoStore {
  // State
  records: TenkoRecord[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchRecords: () => Promise<void>;
  addRecord: (record: TenkoRecord) => Promise<void>;
  updateRecord: (id: string, data: Partial<TenkoRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  // Computed values (optional)
  get todayRecords(): TenkoRecord[];
}
```

### 7.2 Storeの使用

```typescript
// Good - 必要なものだけを取得
const { records, fetchRecords } = useTenkoStore((state) => ({
  records: state.records,
  fetchRecords: state.fetchRecords,
}));

// Bad - Store全体を取得
const store = useTenkoStore();
```

## 8. テストコード

### 8.1 テストファイルの配置

```
src/
├── components/
│   └── Button.tsx
└── __tests__/
    └── components/
        └── Button.test.tsx
```

### 8.2 テストの書き方

```typescript
describe('Button', () => {
  it('正しくレンダリングされる', () => {
    const { getByText } = render(
      <Button onPress={jest.fn()}>
        クリック
      </Button>
    );
    expect(getByText('クリック')).toBeTruthy();
  });

  it('クリックイベントが発火する', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>
        クリック
      </Button>
    );
    fireEvent.press(getByText('クリック'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

## 9. コミット規則

### 9.1 コミットメッセージフォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 9.2 タイプ一覧

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: フォーマット修正（コードの動作に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド設定、依存関係の更新など

### 9.3 例

```
feat(auth): SMS認証機能を追加

- Twilio SDKを導入
- SMSコード検証エンドポイントを実装
- 再送信機能を含む

Closes #123
```

## 10. コードレビューチェックリスト

- [ ] 命名規則に従っているか
- [ ] TypeScriptの型が適切に定義されているか
- [ ] エラーハンドリングが適切か
- [ ] 不要なconsole.logが残っていないか
- [ ] パフォーマンスの問題はないか
- [ ] アクセシビリティは考慮されているか
- [ ] テストは書かれているか
- [ ] コミットメッセージは規則に従っているか
