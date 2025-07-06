# delilog 状態管理仕様書

## 1. 状態管理アーキテクチャ

### 1.1 技術選定

- **状態管理ライブラリ**: Zustand 4.x
- **非同期状態**: React Query（将来的な導入検討）
- **フォーム状態**: React Hook Form
- **永続化**: Zustand persist middleware + AsyncStorage

### 1.2 設計原則

1. **単一責任**: 各ストアは特定のドメインに特化
2. **正規化**: データの重複を避ける
3. **派生状態**: 計算可能な値はgetterで提供
4. **不変性**: immerを使用して安全な更新
5. **型安全性**: TypeScriptで完全な型定義

## 2. ストア設計

### 2.1 認証ストア (authStore)

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  email: string;
  companyName: string;
  driverName: string;
  officeName?: string;
  subscriptionTier: 'basic' | 'pro';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due';
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Computed
  get isAuthenticated(): boolean;
  get isProUser(): boolean;
  get canAccessFeature(): (feature: string) => boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (method: 'email' | 'google' | 'apple', credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Computed values
      get isAuthenticated() {
        return !!get().session && !!get().user;
      },

      get isProUser() {
        return (
          get().user?.subscriptionTier === 'pro' && get().user?.subscriptionStatus === 'active'
        );
      },

      get canAccessFeature() {
        return (feature: string) => {
          const user = get().user;
          if (!user) return false;

          const proFeatures = ['webApp', 'advancedAnalytics', 'unlimitedVehicles'];
          if (proFeatures.includes(feature)) {
            return get().isProUser;
          }

          return true;
        };
      },

      // Actions
      initialize: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          if (session) {
            const { data: profile } = await supabase
              .from('users_profile')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set((state) => {
              state.session = session;
              state.user = profile;
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set((state) => {
            state.error = error as Error;
          });
        } finally {
          set((state) => {
            state.isLoading = false;
            state.isInitialized = true;
          });
        }
      },

      login: async (method, credentials) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          let authResult;

          switch (method) {
            case 'email':
              authResult = await supabase.auth.signInWithPassword(credentials);
              break;
            case 'google':
              authResult = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: 'delilog://auth' },
              });
              break;
            case 'apple':
              authResult = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: { redirectTo: 'delilog://auth' },
              });
              break;
          }

          if (authResult.error) throw authResult.error;

          // プロフィール取得
          const { data: profile } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', authResult.data.user.id)
            .single();

          set((state) => {
            state.session = authResult.data.session;
            state.user = profile;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await supabase.auth.signOut();

          set((state) => {
            state.user = null;
            state.session = null;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updateProfile: async (data) => {
        const userId = get().user?.id;
        if (!userId) throw new Error('User not authenticated');

        set((state) => {
          state.isLoading = true;
        });

        try {
          const { error } = await supabase.from('users_profile').update(data).eq('id', userId);

          if (error) throw error;

          set((state) => {
            if (state.user) {
              Object.assign(state.user, data);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      refreshSession: async () => {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) throw error;

        set((state) => {
          state.session = data.session;
        });
      },

      clearError: () =>
        set((state) => {
          state.error = null;
        }),
    })),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
      partialize: (state) => ({ user: state.user }), // sessionは保存しない
    }
  )
);
```

### 2.2 点呼記録ストア (tenkoStore)

```typescript
// store/tenkoStore.ts
interface TenkoRecord {
  id: string;
  userId: string;
  vehicleId: string;
  date: Date;
  type: 'before' | 'after';
  checkMethod: string;
  executor: string;
  alcoholDetectorUsed: boolean;
  alcoholDetected: boolean;
  alcoholLevel: number;
  healthStatus?: 'good' | 'caution' | 'poor';
  dailyCheckCompleted?: boolean;
  operationStatus?: 'ok' | 'ng';
  notes?: string;
  isOfflineCreated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TenkoState {
  // State
  records: Record<string, TenkoRecord>; // 正規化されたデータ
  recordIds: string[]; // 順序を保持
  isLoading: boolean;
  isSyncing: boolean;
  error: Error | null;
  lastSyncedAt: Date | null;

  // Computed
  get allRecords(): TenkoRecord[];
  get todayRecords(): TenkoRecord[];
  get weekRecords(): (startDate: Date) => TenkoRecord[];
  get hasCompletedToday(): { before: boolean; after: boolean };
  get offlineRecords(): TenkoRecord[];

  // Actions
  fetchRecords: (startDate?: Date, endDate?: Date) => Promise<void>;
  addRecord: (data: Omit<TenkoRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, data: Partial<TenkoRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  syncOfflineRecords: () => Promise<void>;
  clearCache: () => void;
}

export const useTenkoStore = create<TenkoState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      records: {},
      recordIds: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      lastSyncedAt: null,

      // Computed values
      get allRecords() {
        const { records, recordIds } = get();
        return recordIds.map((id) => records[id]).filter(Boolean);
      },

      get todayRecords() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return get().allRecords.filter((record) => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        });
      },

      get weekRecords() {
        return (startDate: Date) => {
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);

          return get().allRecords.filter((record) => {
            const recordDate = new Date(record.date);
            return recordDate >= startDate && recordDate <= endDate;
          });
        };
      },

      get hasCompletedToday() {
        const todayRecords = get().todayRecords;
        return {
          before: todayRecords.some((r) => r.type === 'before'),
          after: todayRecords.some((r) => r.type === 'after'),
        };
      },

      get offlineRecords() {
        return get().allRecords.filter((r) => r.isOfflineCreated);
      },

      // Actions
      fetchRecords: async (startDate, endDate) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const userId = useAuthStore.getState().user?.id;
          if (!userId) throw new Error('User not authenticated');

          let query = supabase
            .from('tenko_records')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (startDate) {
            query = query.gte('date', startDate.toISOString());
          }
          if (endDate) {
            query = query.lte('date', endDate.toISOString());
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.records = {};
            state.recordIds = [];

            data.forEach((record) => {
              state.records[record.id] = record;
              state.recordIds.push(record.id);
            });

            state.lastSyncedAt = new Date();
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      addRecord: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const isOnline = await checkNetworkStatus();

        const newRecord: TenkoRecord = {
          ...data,
          id: tempId,
          isOfflineCreated: !isOnline,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 楽観的更新
        set((state) => {
          state.records[tempId] = newRecord;
          state.recordIds.unshift(tempId);
        });

        if (isOnline) {
          try {
            const { data: savedRecord, error } = await supabase
              .from('tenko_records')
              .insert(data)
              .select()
              .single();

            if (error) throw error;

            // 実際のIDで更新
            set((state) => {
              delete state.records[tempId];
              state.records[savedRecord.id] = savedRecord;

              const index = state.recordIds.indexOf(tempId);
              if (index !== -1) {
                state.recordIds[index] = savedRecord.id;
              }
            });
          } catch (error) {
            // ロールバック
            set((state) => {
              delete state.records[tempId];
              state.recordIds = state.recordIds.filter((id) => id !== tempId);
            });
            throw error;
          }
        }
      },

      syncOfflineRecords: async () => {
        const offlineRecords = get().offlineRecords;
        if (offlineRecords.length === 0) return;

        set((state) => {
          state.isSyncing = true;
        });

        for (const record of offlineRecords) {
          try {
            const { isOfflineCreated, id: tempId, ...recordData } = record;

            const { data: savedRecord, error } = await supabase
              .from('tenko_records')
              .insert(recordData)
              .select()
              .single();

            if (error) throw error;

            set((state) => {
              delete state.records[tempId];
              state.records[savedRecord.id] = savedRecord;

              const index = state.recordIds.indexOf(tempId);
              if (index !== -1) {
                state.recordIds[index] = savedRecord.id;
              }
            });
          } catch (error) {
            console.error('Sync error for record:', record.id, error);
          }
        }

        set((state) => {
          state.isSyncing = false;
          state.lastSyncedAt = new Date();
        });
      },
    })),
    {
      name: 'tenko-storage',
      storage: AsyncStorage,
    }
  )
);
```

### 2.3 車両管理ストア (vehicleStore)

```typescript
// store/vehicleStore.ts
interface Vehicle {
  id: string;
  userId: string;
  plateNumber: string;
  vehicleName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface VehicleState {
  // State
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  isLoading: boolean;
  error: Error | null;

  // Computed
  get activeVehicles(): Vehicle[];
  get defaultVehicle(): Vehicle | null;
  get canAddMore(): boolean;

  // Actions
  fetchVehicles: () => Promise<void>;
  addVehicle: (data: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  setDefaultVehicle: (id: string) => Promise<void>;
  selectVehicle: (id: string) => void;
}

export const useVehicleStore = create<VehicleState>()(
  immer((set, get) => ({
    // Initial state
    vehicles: [],
    selectedVehicleId: null,
    isLoading: false,
    error: null,

    // Computed values
    get activeVehicles() {
      return get().vehicles.filter((v) => v.isActive);
    },

    get defaultVehicle() {
      return get().activeVehicles.find((v) => v.isDefault) || null;
    },

    get canAddMore() {
      const isProUser = useAuthStore.getState().isProUser;
      const activeCount = get().activeVehicles.length;

      return isProUser || activeCount < 3;
    },

    // Actions implementation...
  }))
);
```

### 2.4 設定ストア (settingsStore)

```typescript
// store/settingsStore.ts
interface NotificationSettings {
  enabled: boolean;
  morningReminder: boolean;
  morningReminderTime: string; // "08:00"
  eveningReminder: boolean;
  eveningReminderTime: string; // "18:00"
}

interface SettingsState {
  // State
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  notifications: NotificationSettings;
  soundEnabled: boolean;
  biometricEnabled: boolean;

  // Actions
  updateTheme: (theme: SettingsState['theme']) => void;
  updateLanguage: (language: SettingsState['language']) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  toggleSound: () => void;
  toggleBiometric: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      // Initial state
      theme: 'system',
      language: 'ja',
      notifications: {
        enabled: true,
        morningReminder: true,
        morningReminderTime: '08:00',
        eveningReminder: true,
        eveningReminderTime: '18:00',
      },
      soundEnabled: true,
      biometricEnabled: false,

      // Actions
      updateTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),
      updateLanguage: (language) =>
        set((state) => {
          state.language = language;
        }),
      updateNotifications: (settings) =>
        set((state) => {
          Object.assign(state.notifications, settings);
        }),
      toggleSound: () =>
        set((state) => {
          state.soundEnabled = !state.soundEnabled;
        }),
      toggleBiometric: () =>
        set((state) => {
          state.biometricEnabled = !state.biometricEnabled;
        }),
    })),
    {
      name: 'settings-storage',
      storage: AsyncStorage,
    }
  )
);
```

## 3. ストア間の連携

### 3.1 依存関係

```typescript
// 依存関係の図
/*
  authStore (基盤)
      ↓
  ├── tenkoStore
  ├── vehicleStore
  └── settingsStore
*/
```

### 3.2 連携パターン

```typescript
// 例: 認証状態の変化を監視
useEffect(() => {
  const unsubscribe = useAuthStore.subscribe(
    (state) => state.user,
    (user) => {
      if (!user) {
        // ログアウト時にデータをクリア
        useTenkoStore.getState().clearCache();
        useVehicleStore.getState().clearCache();
      } else {
        // ログイン時にデータを取得
        useTenkoStore.getState().fetchRecords();
        useVehicleStore.getState().fetchVehicles();
      }
    }
  );

  return unsubscribe;
}, []);
```

## 4. パフォーマンス最適化

### 4.1 セレクターの使用

```typescript
// 必要な部分だけを購読
const user = useAuthStore((state) => state.user);
const isLoading = useAuthStore((state) => state.isLoading);

// 複数の値を取得する場合
const { records, isLoading } = useTenkoStore(
  (state) => ({ records: state.todayRecords, isLoading: state.isLoading }),
  shallow // 浅い比較で再レンダリングを最適化
);
```

### 4.2 メモ化

```typescript
// 計算コストの高い処理はuseMemoで包む
const weeklyStats = useMemo(() => {
  const records = useTenkoStore.getState().weekRecords(startDate);
  return calculateStats(records);
}, [startDate]);
```

## 5. テスト戦略

### 5.1 ストアのテスト

```typescript
// __tests__/store/authStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../../store/authStore';

// ストアのリセット
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });
});

describe('authStore', () => {
  it('ログイン状態を正しく管理する', async () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login('email', {
        email: 'test@example.com',
        password: 'password',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
  });
});
```

## 6. デバッグとモニタリング

### 6.1 Redux DevToolsの統合

```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ... store implementation
      })),
      { name: 'auth-storage' }
    ),
    { name: 'auth-store' } // DevToolsでの表示名
  )
);
```

### 6.2 ロギング

```typescript
// 開発環境でのアクション追跡
if (__DEV__) {
  useAuthStore.subscribe((state) => {
    console.log('Auth state changed:', state);
  });
}
```
