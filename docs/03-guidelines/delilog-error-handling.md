# delilog エラーハンドリングガイド

## 1. エラーの分類と対処方針

### 1.1 エラーカテゴリー

#### ネットワークエラー

**特徴**: インターネット接続の問題、APIタイムアウト

```typescript
class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**対処方針**:

- オフラインモードへの自動切り替え
- リトライ機構の実装（最大3回）
- ローカルキャッシュの活用

#### 認証エラー

**特徴**: ログイン失敗、セッション切れ、権限不足

```typescript
class AuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED' | 'PERMISSION_DENIED'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

**対処方針**:

- セッション切れ: 自動的に再ログイン画面へ
- 権限不足: 機能制限の明確な表示
- 認証失敗: 具体的な対処法を提示

#### バリデーションエラー

**特徴**: 入力値の不正、必須項目の未入力

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public rule: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**対処方針**:

- 該当フィールドの強調表示
- 具体的な修正方法の提示
- リアルタイムバリデーション

#### ビジネスロジックエラー

**特徴**: 業務ルール違反、制限超過

```typescript
class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}
```

**対処方針**:

- わかりやすい説明文
- 代替案の提示
- アップグレードへの誘導（必要に応じて）

### 1.2 エラーの重要度

```typescript
enum ErrorSeverity {
  INFO = 'info', // 情報提供（トースト表示）
  WARNING = 'warning', // 警告（確認ダイアログ）
  ERROR = 'error', // エラー（画面内表示）
  CRITICAL = 'critical', // 致命的（フルスクリーンエラー）
}
```

## 2. エラーメッセージ設計

### 2.1 メッセージ構造

```typescript
interface ErrorMessage {
  title: string; // 簡潔なエラータイトル
  description: string; // 詳細な説明
  action?: string; // ユーザーが取るべき行動
  technical?: string; // 技術的な詳細（開発モードのみ）
}
```

### 2.2 メッセージ例

```typescript
const ERROR_MESSAGES = {
  // ネットワークエラー
  NETWORK_OFFLINE: {
    title: 'オフラインです',
    description: 'インターネット接続を確認してください',
    action: 'データは自動的に保存され、接続が回復したら同期されます',
  },

  NETWORK_TIMEOUT: {
    title: '接続がタイムアウトしました',
    description: 'サーバーからの応答がありません',
    action: 'しばらく待ってから再度お試しください',
  },

  // 認証エラー
  AUTH_INVALID_CREDENTIALS: {
    title: 'ログインに失敗しました',
    description: 'メールアドレスまたはパスワードが正しくありません',
    action: 'もう一度確認して入力してください',
  },

  AUTH_SESSION_EXPIRED: {
    title: 'セッションの有効期限が切れました',
    description: 'セキュリティのため、再度ログインが必要です',
    action: '再ログインする',
  },

  // バリデーションエラー
  VALIDATION_REQUIRED: {
    title: '必須項目です',
    description: 'この項目は必ず入力してください',
  },

  VALIDATION_ALCOHOL_LEVEL: {
    title: '数値が正しくありません',
    description: 'アルコール濃度は0.00〜0.99の範囲で入力してください',
  },

  // ビジネスロジックエラー
  BUSINESS_VEHICLE_LIMIT: {
    title: '車両登録数の上限に達しました',
    description: 'ベーシックプランでは3台までしか登録できません',
    action: 'プロプランにアップグレードすると無制限に登録できます',
  },

  BUSINESS_DUPLICATE_RECORD: {
    title: 'すでに記録が存在します',
    description: '同じ日の同じ種類の点呼記録は1つしか作成できません',
    action: '既存の記録を編集してください',
  },
};
```

## 3. エラーハンドリング実装

### 3.1 グローバルエラーハンドラー

```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const showToast = useToast();
  const navigation = useNavigation();

  const handleError = useCallback((error: Error, severity: ErrorSeverity = ErrorSeverity.ERROR) => {
    console.error('Error occurred:', error);

    // エラーレポーティング（本番環境のみ）
    if (!__DEV__) {
      reportErrorToSentry(error);
    }

    // エラータイプに応じた処理
    if (error instanceof NetworkError) {
      handleNetworkError(error);
    } else if (error instanceof AuthError) {
      handleAuthError(error);
    } else if (error instanceof ValidationError) {
      handleValidationError(error);
    } else if (error instanceof BusinessError) {
      handleBusinessError(error);
    } else {
      handleUnknownError(error);
    }
  }, []);

  const handleNetworkError = (error: NetworkError) => {
    if (error.statusCode === 0) {
      // オフライン
      showToast({
        type: 'info',
        title: ERROR_MESSAGES.NETWORK_OFFLINE.title,
        description: ERROR_MESSAGES.NETWORK_OFFLINE.action,
      });
    } else if (error.statusCode === 408) {
      // タイムアウト
      showToast({
        type: 'error',
        title: ERROR_MESSAGES.NETWORK_TIMEOUT.title,
        description: ERROR_MESSAGES.NETWORK_TIMEOUT.description,
      });
    }
  };

  const handleAuthError = (error: AuthError) => {
    if (error.code === 'SESSION_EXPIRED') {
      // ログイン画面へ遷移
      navigation.navigate('Login', {
        message: ERROR_MESSAGES.AUTH_SESSION_EXPIRED.description,
      });
    }
  };

  return { handleError };
};
```

### 3.2 Try-Catchパターン

```typescript
// 推奨されるエラーハンドリングパターン
const saveTenkoRecord = async (data: TenkoFormData) => {
  const { handleError } = useErrorHandler();

  try {
    setLoading(true);

    // バリデーション
    const validationResult = validateTenkoData(data);
    if (!validationResult.isValid) {
      throw new ValidationError(
        validationResult.message,
        validationResult.field,
        validationResult.rule
      );
    }

    // API呼び出し
    const result = await api.saveTenkoRecord(data);

    // 成功処理
    showSuccessToast('記録を保存しました');
    navigation.goBack();
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

### 3.3 非同期エラーバウンダリー

```typescript
// components/AsyncErrorBoundary.tsx
interface State {
  hasError: boolean;
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    reportErrorToSentry(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
```

## 4. UI/UXパターン

### 4.1 エラー表示コンポーネント

```typescript
// components/ErrorMessage.tsx
interface ErrorMessageProps {
  error: Error;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  severity = ErrorSeverity.ERROR,
  onRetry,
  onDismiss,
}) => {
  const message = getErrorMessage(error);

  return (
    <View className={`p-4 rounded-lg ${getBackgroundColor(severity)}`}>
      <View className="flex-row items-center">
        <Icon name={getIcon(severity)} size={20} color={getIconColor(severity)} />
        <Text className="ml-2 font-semibold">{message.title}</Text>
      </View>

      {message.description && (
        <Text className="mt-2 text-sm text-gray-600">
          {message.description}
        </Text>
      )}

      {message.action && (
        <Text className="mt-2 text-sm font-medium text-primary-600">
          {message.action}
        </Text>
      )}

      <View className="flex-row mt-3">
        {onRetry && (
          <TouchableOpacity onPress={onRetry} className="mr-3">
            <Text className="text-primary-600 font-medium">再試行</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Text className="text-gray-500">閉じる</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

### 4.2 フォームバリデーションエラー

```typescript
// components/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
}) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {label}
      </Text>

      <View className={error ? 'border-red-500' : 'border-gray-300'}>
        {children}
      </View>

      {error && (
        <View className="flex-row items-center mt-1">
          <Icon name="alert-circle" size={12} color="#EF4444" />
          <Text className="ml-1 text-xs text-red-500">{error}</Text>
        </View>
      )}
    </View>
  );
};
```

### 4.3 エラースクリーン

```typescript
// screens/ErrorScreen.tsx
export const ErrorScreen: React.FC<{
  error: Error;
  onReset: () => void;
}> = ({ error, onReset }) => {
  const isNetworkError = error instanceof NetworkError;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center p-6">
        <Icon
          name={isNetworkError ? 'wifi-off' : 'alert-triangle'}
          size={64}
          color="#6B7280"
        />

        <Text className="mt-4 text-xl font-semibold text-gray-900">
          {isNetworkError ? 'ネットワークエラー' : 'エラーが発生しました'}
        </Text>

        <Text className="mt-2 text-center text-gray-600">
          {error.message}
        </Text>

        <TouchableOpacity
          onPress={onReset}
          className="mt-6 bg-primary-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-medium">
            {isNetworkError ? '再接続' : 'もう一度試す'}
          </Text>
        </TouchableOpacity>

        {__DEV__ && (
          <Text className="mt-4 text-xs text-gray-400">
            {error.stack}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};
```

## 5. オフライン対応

### 5.1 ネットワーク状態の監視

```typescript
// hooks/useNetworkStatus.ts
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnectionSlow, setIsConnectionSlow] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);

      // 接続速度の判定
      if (state.details && 'effectiveType' in state.details) {
        setIsConnectionSlow(
          state.details.effectiveType === '2g' || state.details.effectiveType === 'slow-2g'
        );
      }
    });

    return unsubscribe;
  }, []);

  return { isOnline, isConnectionSlow };
};
```

### 5.2 オフライン時の動作

```typescript
// services/offlineManager.ts
class OfflineManager {
  private queue: OfflineRequest[] = [];

  async addToQueue(request: OfflineRequest) {
    this.queue.push({
      ...request,
      id: generateId(),
      timestamp: new Date(),
      retryCount: 0,
    });

    await this.saveQueue();
  }

  async syncQueue() {
    const { isOnline } = await NetInfo.fetch();
    if (!isOnline) return;

    const pendingRequests = [...this.queue];

    for (const request of pendingRequests) {
      try {
        await this.processRequest(request);
        this.removeFromQueue(request.id);
      } catch (error) {
        if (request.retryCount < MAX_RETRY_COUNT) {
          request.retryCount++;
        } else {
          // 最大リトライ回数を超えた場合
          this.handleFailedRequest(request);
        }
      }
    }

    await this.saveQueue();
  }
}
```

## 6. エラー分析とモニタリング

### 6.1 エラーレポーティング

```typescript
// services/errorReporting.ts
export const reportErrorToSentry = (error: Error, context?: any) => {
  if (__DEV__) return;

  Sentry.captureException(error, {
    tags: {
      type: error.name,
      severity: getErrorSeverity(error),
    },
    contexts: {
      app: {
        version: Constants.manifest?.version,
        build: Constants.manifest?.ios?.buildNumber,
      },
      device: {
        platform: Platform.OS,
        version: Platform.Version,
      },
      ...context,
    },
  });
};
```

### 6.2 エラー発生率の追跡

```typescript
// utils/analytics.ts
export const trackError = (error: Error, screen: string) => {
  analytics.track('Error Occurred', {
    error_type: error.name,
    error_message: error.message,
    screen_name: screen,
    timestamp: new Date().toISOString(),
  });
};
```

## 7. テストとデバッグ

### 7.1 エラーケースのテスト

```typescript
// __tests__/errorHandling.test.ts
describe('Error Handling', () => {
  it('ネットワークエラーを適切に処理する', async () => {
    // モックの設定
    jest
      .spyOn(api, 'saveTenkoRecord')
      .mockRejectedValue(new NetworkError('Network request failed', 0));

    // テスト実行
    const { result } = renderHook(() => useTenkoRecords());
    await act(async () => {
      await result.current.save(mockData);
    });

    // 検証
    expect(result.current.error).toBeInstanceOf(NetworkError);
    expect(result.current.isOffline).toBe(true);
  });
});
```

### 7.2 開発時のエラーシミュレーション

```typescript
// デバッグメニューでエラーを発生させる
if (__DEV__) {
  global.simulateError = (type: string) => {
    switch (type) {
      case 'network':
        throw new NetworkError('Simulated network error', 500);
      case 'auth':
        throw new AuthError('Simulated auth error', 'SESSION_EXPIRED');
      case 'validation':
        throw new ValidationError('Simulated validation error', 'email', 'required');
      default:
        throw new Error('Simulated generic error');
    }
  };
}
```
