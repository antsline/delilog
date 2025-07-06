# delilog テスト仕様書

## 1. テスト戦略

### 1.1 テストピラミッド

```
         ┌─────┐
        │ E2E │ 10%
       ├───────┤
      │統合テスト│ 30%
     ├───────────┤
    │ユニットテスト│ 60%
   └───────────────┘
```

### 1.2 テストカバレッジ目標

- 全体: 70%以上
- コアビジネスロジック: 90%以上
- UIコンポーネント: 60%以上
- ユーティリティ関数: 100%

### 1.3 使用ツール

- **ユニットテスト**: Jest + React Native Testing Library
- **統合テスト**: Jest + MSW (Mock Service Worker)
- **E2Eテスト**: Detox
- **パフォーマンステスト**: React Native Performance Monitor

## 2. ユニットテスト

### 2.1 カスタムフック

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('ログインが成功する', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      companyName: 'テスト運送',
    };

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('email', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('ログインエラーを処理する', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(
        result.current.login('email', {
          email: 'invalid@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('認証に失敗しました');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 2.2 ユーティリティ関数

```typescript
// __tests__/utils/validation.test.ts
import { validateAlcoholLevel, validateHealthStatus } from '../../utils/validation';

describe('validateAlcoholLevel', () => {
  it('有効な値を受け入れる', () => {
    expect(validateAlcoholLevel(0)).toBe(true);
    expect(validateAlcoholLevel(0.03)).toBe(true);
    expect(validateAlcoholLevel(0.99)).toBe(true);
  });

  it('無効な値を拒否する', () => {
    expect(validateAlcoholLevel(-0.01)).toBe(false);
    expect(validateAlcoholLevel(1)).toBe(false);
    expect(validateAlcoholLevel(NaN)).toBe(false);
  });
});

describe('validateHealthStatus', () => {
  it('有効なステータスを受け入れる', () => {
    expect(validateHealthStatus('good')).toBe(true);
    expect(validateHealthStatus('caution')).toBe(true);
    expect(validateHealthStatus('poor')).toBe(true);
  });

  it('無効なステータスを拒否する', () => {
    expect(validateHealthStatus('invalid')).toBe(false);
    expect(validateHealthStatus('')).toBe(false);
    expect(validateHealthStatus(null)).toBe(false);
  });
});
```

### 2.3 状態管理（Zustand）

```typescript
// __tests__/store/tenkoStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useTenkoStore } from '../../store/tenkoStore';

describe('tenkoStore', () => {
  beforeEach(() => {
    useTenkoStore.setState({
      records: [],
      isLoading: false,
      error: null,
    });
  });

  it('記録を追加できる', async () => {
    const { result } = renderHook(() => useTenkoStore());

    const newRecord = {
      type: 'before',
      vehicleId: 'vehicle-1',
      alcoholLevel: 0,
      healthStatus: 'good',
    };

    await act(async () => {
      await result.current.addRecord(newRecord);
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0]).toMatchObject(newRecord);
  });

  it('今日の記録を取得できる', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    useTenkoStore.setState({
      records: [
        { id: '1', date: today, type: 'before' },
        { id: '2', date: today, type: 'after' },
        { id: '3', date: yesterday, type: 'before' },
      ],
    });

    const { result } = renderHook(() => useTenkoStore());

    expect(result.current.todayRecords).toHaveLength(2);
    expect(result.current.todayRecords[0].id).toBe('1');
    expect(result.current.todayRecords[1].id).toBe('2');
  });
});
```

## 3. コンポーネントテスト

### 3.1 UIコンポーネント

```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  it('正しくレンダリングされる', () => {
    const { getByText } = render(
      <Button onPress={jest.fn()}>
        テストボタン
      </Button>
    );

    expect(getByText('テストボタン')).toBeTruthy();
  });

  it('押下イベントが発火する', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>
        クリック
      </Button>
    );

    fireEvent.press(getByText('クリック'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('無効状態で押下できない', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        無効なボタン
      </Button>
    );

    fireEvent.press(getByText('無効なボタン'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ローディング中は押下できない', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} loading testID="loading-button">
        ローディング
      </Button>
    );

    fireEvent.press(getByTestId('loading-button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 3.2 フォームコンポーネント

```typescript
// __tests__/components/TenkoForm.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TenkoForm } from '../../components/features/tenko/TenkoForm';

describe('TenkoForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期値が正しく表示される', () => {
    const { getByTestId } = render(
      <TenkoForm type="before" onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('alcohol-input').props.value).toBe('0.00');
    expect(getByTestId('health-status-good')).toHaveProperty('selected', true);
  });

  it('バリデーションエラーを表示する', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <TenkoForm type="before" onSubmit={mockOnSubmit} />
    );

    // アルコール値を不正な値に変更
    fireEvent.changeText(getByTestId('alcohol-input'), '1.5');

    // フォーム送信
    fireEvent.press(getByText('記録する'));

    await waitFor(() => {
      expect(queryByText('アルコール濃度は0.00〜0.99の範囲で入力してください')).toBeTruthy();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('正常に送信できる', async () => {
    const { getByTestId, getByText } = render(
      <TenkoForm type="before" onSubmit={mockOnSubmit} />
    );

    // フォーム入力
    fireEvent.changeText(getByTestId('alcohol-input'), '0.00');
    fireEvent.press(getByTestId('health-status-good'));
    fireEvent.changeText(getByTestId('notes-input'), 'テストメモ');

    // フォーム送信
    fireEvent.press(getByText('記録する'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        alcoholLevel: 0,
        healthStatus: 'good',
        notes: 'テストメモ',
        dailyCheckCompleted: true,
      });
    });
  });
});
```

## 4. 統合テスト

### 4.1 API統合テスト

```typescript
// __tests__/integration/api.test.ts
import { server } from '../../mocks/server';
import { rest } from 'msw';
import { api } from '../../services/api';

describe('API Integration', () => {
  it('点呼記録を保存できる', async () => {
    const recordData = {
      type: 'before',
      vehicleId: 'vehicle-1',
      alcoholLevel: 0,
      healthStatus: 'good',
    };

    const result = await api.saveTenkoRecord(recordData);

    expect(result).toMatchObject({
      id: expect.any(String),
      ...recordData,
      createdAt: expect.any(String),
    });
  });

  it('ネットワークエラーを処理する', async () => {
    server.use(
      rest.post('*/tenko_records', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(api.saveTenkoRecord({})).rejects.toThrow('サーバーエラーが発生しました');
  });

  it('認証エラーを処理する', async () => {
    server.use(
      rest.post('*/tenko_records', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
      })
    );

    await expect(api.saveTenkoRecord({})).rejects.toThrow('認証が必要です');
  });
});
```

### 4.2 オフライン同期テスト

```typescript
// __tests__/integration/offlineSync.test.ts
import NetInfo from '@react-native-community/netinfo';
import { OfflineManager } from '../../services/offlineManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Offline Sync', () => {
  let offlineManager: OfflineManager;

  beforeEach(async () => {
    await AsyncStorage.clear();
    offlineManager = new OfflineManager();
  });

  it('オフライン時にキューに追加される', async () => {
    // オフライン状態をシミュレート
    NetInfo.fetch = jest.fn().mockResolvedValue({ isConnected: false });

    const record = {
      type: 'before',
      vehicleId: 'vehicle-1',
      alcoholLevel: 0,
    };

    await offlineManager.addToQueue({
      method: 'POST',
      endpoint: '/tenko_records',
      data: record,
    });

    const queue = await offlineManager.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].data).toEqual(record);
  });

  it('オンライン復帰時に同期される', async () => {
    // オフラインでキューに追加
    NetInfo.fetch = jest.fn().mockResolvedValue({ isConnected: false });
    await offlineManager.addToQueue({
      method: 'POST',
      endpoint: '/tenko_records',
      data: { type: 'before' },
    });

    // オンラインに復帰
    NetInfo.fetch = jest.fn().mockResolvedValue({ isConnected: true });

    const syncResult = await offlineManager.syncQueue();

    expect(syncResult.synced).toHaveLength(1);
    expect(syncResult.failed).toHaveLength(0);

    const queue = await offlineManager.getQueue();
    expect(queue).toHaveLength(0);
  });
});
```

## 5. E2Eテスト

### 5.1 新規ユーザー登録フロー

```typescript
// e2e/auth/registration.e2e.ts
describe('新規ユーザー登録', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('メールアドレスで新規登録できる', async () => {
    // ログイン画面へ
    await expect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('register-button')).tap();

    // 登録情報入力
    await element(by.id('company-name-input')).typeText('テスト運送');
    await element(by.id('driver-name-input')).typeText('山田太郎');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('plate-number-input')).typeText('品川500あ1234');

    // 登録実行
    await element(by.id('submit-button')).tap();

    // ホーム画面に遷移
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('山田太郎'))).toBeVisible();
  });
});
```

### 5.2 点呼記録作成フロー

```typescript
// e2e/tenko/create-record.e2e.ts
describe('点呼記録作成', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });

  it('業務前点呼を記録できる', async () => {
    // ホーム画面から業務前点呼へ
    await element(by.id('before-tenko-button')).tap();

    // デフォルト値の確認
    await expect(element(by.id('alcohol-input'))).toHaveText('0.00');

    // 健康状態を選択
    await element(by.id('health-status-good')).tap();

    // 特記事項入力
    await element(by.id('notes-input')).typeText('異常なし');

    // 記録を保存
    await element(by.id('save-button')).tap();

    // ホーム画面に戻る
    await waitFor(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.text('業務前点呼完了'))).toBeVisible();
  });

  it('同じ日に重複して記録できない', async () => {
    // 再度業務前点呼を試みる
    await element(by.id('before-tenko-button')).tap();

    // エラーメッセージが表示される
    await waitFor(element(by.text('本日の業務前点呼は既に記録されています')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### 5.3 PDF生成フロー

```typescript
// e2e/pdf/generate.e2e.ts
describe('PDF生成', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
    await createWeeklyRecords(); // テストデータ作成
  });

  it('週次PDFを生成できる', async () => {
    // 記録一覧画面へ
    await element(by.id('records-tab')).tap();

    // PDF出力ボタンをタップ
    await element(by.id('pdf-button-2024-01-15')).tap();

    // プレビュー画面が表示される
    await waitFor(element(by.id('pdf-preview'))).toBeVisible();

    // PDFを保存
    await element(by.id('save-pdf-button')).tap();

    // 成功メッセージ
    await waitFor(element(by.text('PDFを保存しました')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## 6. パフォーマンステスト

### 6.1 起動時間テスト

```typescript
// __tests__/performance/startup.test.ts
describe('アプリ起動パフォーマンス', () => {
  it('3秒以内に起動する', async () => {
    const startTime = Date.now();

    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('app-ready'))).toBeVisible();

    const launchTime = Date.now() - startTime;
    expect(launchTime).toBeLessThan(3000);
  });
});
```

### 6.2 大量データ処理テスト

```typescript
// __tests__/performance/largeData.test.ts
describe('大量データパフォーマンス', () => {
  it('1000件の記録をスムーズに表示できる', async () => {
    // 1000件のテストデータを作成
    const records = generateMockRecords(1000);
    await insertTestRecords(records);

    // 記録一覧画面へ
    await element(by.id('records-tab')).tap();

    // FPSを計測
    await device.setMetricsRecording(true);

    // スクロール
    await element(by.id('records-list')).scroll(500, 'down');
    await element(by.id('records-list')).scroll(500, 'up');

    const metrics = await device.getMetrics();

    // 平均FPSが55以上であること
    expect(metrics.fps.average).toBeGreaterThan(55);
  });
});
```

## 7. テストデータ

### 7.1 モックデータ生成

```typescript
// __tests__/fixtures/mockData.ts
export const mockUser = {
  id: 'test-user-123',
  email: 'test@delilog.jp',
  companyName: 'テスト運送',
  driverName: 'テスト太郎',
  subscriptionTier: 'basic',
};

export const mockVehicle = {
  id: 'vehicle-123',
  plateNumber: '品川 500 あ 12-34',
  vehicleName: 'テスト車両',
  isDefault: true,
};

export const mockTenkoRecord = {
  id: 'record-123',
  userId: mockUser.id,
  vehicleId: mockVehicle.id,
  date: new Date('2024-01-15'),
  type: 'before',
  alcoholLevel: 0,
  healthStatus: 'good',
  dailyCheckCompleted: true,
  notes: 'テストメモ',
};

export const generateMockRecords = (count: number): TenkoRecord[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockTenkoRecord,
    id: `record-${i}`,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    type: i % 2 === 0 ? 'before' : 'after',
  }));
};
```

### 7.2 テスト環境設定

```typescript
// __tests__/setup.ts
import '@testing-library/jest-native/extend-expect';
import { server } from './mocks/server';

// MSWサーバーのセットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Supabaseのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));
```

## 8. CI/CDでのテスト実行

### 8.1 GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run type check
        run: yarn type-check

      - name: Run linter
        run: yarn lint

      - name: Run unit tests
        run: yarn test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Run integration tests
        run: yarn test:integration

  e2e:
    runs-on: macOS-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup
        run: |
          brew tap wix/brew
          brew install applesimutils
          yarn install --frozen-lockfile
          yarn detox build --configuration ios.sim.release

      - name: Run E2E tests
        run: yarn detox test --configuration ios.sim.release
```

## 9. テスト実行コマンド

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/(?!integration|e2e)",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "detox test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```
