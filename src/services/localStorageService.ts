import AsyncStorage from '@react-native-async-storage/async-storage';
import { TenkoRecord, Vehicle, UserProfile } from '@/types/database';
import { LocalTenkoRecord, LocalVehicle, LocalUserProfile, SyncQueueItem, AppSettings } from '@/types/localDatabase';

// ローカルストレージのキー定義
export const STORAGE_KEYS = {
  TENKO_RECORDS: 'tenko_records',
  VEHICLES: 'vehicles',
  USER_PROFILE: 'user_profile',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
  APP_SETTINGS: 'app_settings',
} as const;

// 型定義は@/types/localDatabaseから使用

export class LocalStorageService {
  // 汎用的なストレージ操作
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`ローカルストレージ保存エラー [${key}]:`, error);
      throw new Error(`ローカルデータの保存に失敗しました: ${key}`);
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`ローカルストレージ取得エラー [${key}]:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`ローカルストレージ削除エラー [${key}]:`, error);
      throw new Error(`ローカルデータの削除に失敗しました: ${key}`);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('ローカルストレージ全削除エラー:', error);
      throw new Error('ローカルデータの全削除に失敗しました');
    }
  }

  // 点呼記録のローカル操作
  static async saveTenkoRecord(record: LocalTenkoRecord): Promise<void> {
    const records = await this.getTenkoRecords();
    const existingIndex = records.findIndex(r => r.local_id === record.local_id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...record,
        updated_at_local: new Date().toISOString(),
      };
    } else {
      records.push({
        ...record,
        created_at_local: new Date().toISOString(),
        updated_at_local: new Date().toISOString(),
      });
    }
    
    await this.setItem(STORAGE_KEYS.TENKO_RECORDS, records);
  }

  static async getTenkoRecords(): Promise<LocalTenkoRecord[]> {
    return (await this.getItem<LocalTenkoRecord[]>(STORAGE_KEYS.TENKO_RECORDS)) || [];
  }

  static async getTenkoRecordsByDate(date: string): Promise<LocalTenkoRecord[]> {
    const records = await this.getTenkoRecords();
    return records.filter(record => record.date === date);
  }

  static async deleteTenkoRecord(localId: string): Promise<void> {
    const records = await this.getTenkoRecords();
    const filteredRecords = records.filter(r => r.local_id !== localId);
    await this.setItem(STORAGE_KEYS.TENKO_RECORDS, filteredRecords);
  }

  // 車両情報のローカル操作
  static async saveVehicles(vehicles: LocalVehicle[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.VEHICLES, vehicles);
  }

  static async getVehicles(): Promise<LocalVehicle[]> {
    return (await this.getItem<LocalVehicle[]>(STORAGE_KEYS.VEHICLES)) || [];
  }

  static async saveVehicle(vehicle: LocalVehicle): Promise<void> {
    const vehicles = await this.getVehicles();
    const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
    
    if (existingIndex >= 0) {
      vehicles[existingIndex] = {
        ...vehicle,
        updated_at_local: new Date().toISOString(),
      };
    } else {
      vehicles.push({
        ...vehicle,
        created_at_local: new Date().toISOString(),
        updated_at_local: new Date().toISOString(),
      });
    }
    
    await this.saveVehicles(vehicles);
  }

  // ユーザープロフィールのローカル操作
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    return await this.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  // 同期キューの管理
  static async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retry_count'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };
    
    queue.push(newItem);
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  static async getSyncQueue(): Promise<SyncQueueItem[]> {
    return (await this.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE)) || [];
  }

  static async removeSyncQueueItem(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, filteredQueue);
  }

  static async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const queue = await this.getSyncQueue();
    const itemIndex = queue.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates };
      await this.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
    }
  }

  static async clearSyncQueue(): Promise<void> {
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  // 同期状態の管理
  static async setLastSyncTime(timestamp: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  static async getLastSyncTime(): Promise<string | null> {
    return await this.getItem<string>(STORAGE_KEYS.LAST_SYNC);
  }

  // アプリ設定の管理
  static async getAppSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      offline_mode_enabled: true,
      auto_sync_enabled: true,
      sync_on_wifi_only: false,
      max_offline_storage_days: 30,
      sync_interval_minutes: 5,
      retry_failed_sync: true,
      max_sync_retries: 3,
      user_preferences: {
        default_check_method: '対面',
        default_executor: '本人',
        default_alcohol_level: '0.00',
        default_health_status: 'good' as const,
        default_daily_check: true,
      },
      notification_settings: {
        enabled: true,
        tenko_reminder_enabled: true,
        sync_failure_alert: true,
        offline_mode_alert: true,
      },
      data_management: {
        auto_backup_enabled: true,
        cleanup_old_data: true,
        export_format: 'json',
        backup_frequency_days: 7,
      },
    };

    const savedSettings = await this.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
    return savedSettings ? { ...defaultSettings, ...savedSettings } : defaultSettings;
  }

  static async updateAppSettings(updates: Partial<AppSettings>): Promise<void> {
    const currentSettings = await this.getAppSettings();
    const newSettings = { ...currentSettings, ...updates };
    await this.setItem(STORAGE_KEYS.APP_SETTINGS, newSettings);
  }

  // ストレージ使用量の確認
  static async getStorageInfo(): Promise<{ totalSize: number; itemCount: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return {
        totalSize,
        itemCount: keys.length,
      };
    } catch (error) {
      console.error('ストレージ情報取得エラー:', error);
      return { totalSize: 0, itemCount: 0 };
    }
  }

  // バックアップとリストア
  static async createBackup(): Promise<string> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const allData: Record<string, any> = {};
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          allData[key] = JSON.parse(value);
        }
      }
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: allData,
      };
      
      return JSON.stringify(backup);
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      throw new Error('バックアップの作成に失敗しました');
    }
  }

  static async restoreFromBackup(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.version || !backup.data) {
        throw new Error('無効なバックアップデータです');
      }
      
      // 既存データをクリア
      await this.clearAll();
      
      // バックアップデータを復元
      for (const [key, value] of Object.entries(backup.data)) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
      
      console.log('バックアップから復元完了:', backup.timestamp);
    } catch (error) {
      console.error('バックアップ復元エラー:', error);
      throw new Error('バックアップの復元に失敗しました');
    }
  }

  // ローカルIDの生成
  static generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // デバッグ用: 全データの取得
  static async getAllData(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      result[key] = await this.getItem(storageKey);
    }
    
    return result;
  }
}