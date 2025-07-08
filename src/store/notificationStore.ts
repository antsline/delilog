/**
 * 通知状態管理ストア
 * Zustandを使用した通知設定の状態管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, NotificationSettings } from '@/services/notificationService';

interface NotificationState {
  // 通知設定
  settings: NotificationSettings;
  
  // 権限状態
  hasPermission: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  
  // プッシュトークン
  pushToken: string | null;
  
  // ローディング状態
  isLoading: boolean;
  isSaving: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション
  initialize: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  toggleBeforeWorkReminder: (enabled: boolean) => Promise<void>;
  toggleAfterWorkReminder: (enabled: boolean) => Promise<void>;
  updateBeforeWorkTime: (time: string) => Promise<void>;
  updateAfterWorkTime: (time: string) => Promise<void>;
  toggleWeekendNotifications: (enabled: boolean) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  clearError: () => void;
}

// デフォルト設定
const defaultSettings: NotificationSettings = {
  enabled: false,
  beforeWork: {
    enabled: true,
    time: '07:00',
  },
  afterWork: {
    enabled: true,
    time: '19:00',
  },
  weekendEnabled: false,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // 初期状態
      settings: defaultSettings,
      hasPermission: false,
      permissionStatus: 'undetermined',
      pushToken: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // 初期化
      initialize: async () => {
        console.log('🔔 通知ストア初期化開始');
        set({ isLoading: true, error: null });

        try {
          // 通知サービスの初期化
          await notificationService.initialize();

          // 権限状態の確認
          const hasPermission = await notificationService.requestPermissions();
          set({ 
            hasPermission,
            permissionStatus: hasPermission ? 'granted' : 'denied'
          });

          // サーバーから設定を取得
          const savedSettings = await notificationService.getNotificationSettings();
          if (savedSettings) {
            set({ settings: savedSettings });
          }

          console.log('✅ 通知ストア初期化完了');
        } catch (error) {
          console.error('❌ 通知ストア初期化エラー:', error);
          set({ error: '通知の初期化に失敗しました' });
        } finally {
          set({ isLoading: false });
        }
      },

      // 設定の更新
      updateSettings: async (updates: Partial<NotificationSettings>) => {
        console.log('📝 通知設定更新:', updates);
        set({ isSaving: true, error: null });

        try {
          const newSettings = { ...get().settings, ...updates };
          
          // サーバーに保存
          await notificationService.saveNotificationSettings(newSettings);
          
          set({ settings: newSettings });
          console.log('✅ 通知設定更新完了');
        } catch (error) {
          console.error('❌ 通知設定更新エラー:', error);
          set({ error: '設定の保存に失敗しました' });
        } finally {
          set({ isSaving: false });
        }
      },

      // 通知のオン/オフ切り替え
      toggleNotifications: async (enabled: boolean) => {
        const { updateSettings } = get();
        await updateSettings({ enabled });
      },

      // 業務前リマインダーの切り替え
      toggleBeforeWorkReminder: async (enabled: boolean) => {
        const { settings, updateSettings } = get();
        await updateSettings({
          beforeWork: { ...settings.beforeWork, enabled }
        });
      },

      // 業務後リマインダーの切り替え
      toggleAfterWorkReminder: async (enabled: boolean) => {
        const { settings, updateSettings } = get();
        await updateSettings({
          afterWork: { ...settings.afterWork, enabled }
        });
      },

      // 業務前リマインダー時刻の更新
      updateBeforeWorkTime: async (time: string) => {
        const { settings, updateSettings } = get();
        await updateSettings({
          beforeWork: { ...settings.beforeWork, time }
        });
      },

      // 業務後リマインダー時刻の更新
      updateAfterWorkTime: async (time: string) => {
        const { settings, updateSettings } = get();
        await updateSettings({
          afterWork: { ...settings.afterWork, time }
        });
      },

      // 週末通知の切り替え
      toggleWeekendNotifications: async (enabled: boolean) => {
        const { updateSettings } = get();
        await updateSettings({ weekendEnabled: enabled });
      },

      // テスト通知の送信
      sendTestNotification: async () => {
        console.log('🔔 テスト通知送信');
        set({ error: null });

        try {
          await notificationService.sendTestNotification();
          console.log('✅ テスト通知送信完了');
        } catch (error) {
          console.error('❌ テスト通知送信エラー:', error);
          set({ error: 'テスト通知の送信に失敗しました' });
        }
      },

      // エラーのクリア
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'notification-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        settings: state.settings,
        hasPermission: state.hasPermission,
        permissionStatus: state.permissionStatus,
      }),
    }
  )
);