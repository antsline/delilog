import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  NetworkStatus, 
  SyncStatus, 
  SyncError, 
  LocalTenkoRecord, 
  LocalVehicle, 
  LocalUserProfile,
  SyncQueueItem,
  AppSettings,
  LocalDataStats 
} from '@/types/localDatabase';
import { LocalStorageService } from '@/services/localStorageService';
import { getNetworkManager } from '@/utils/networkUtils';

interface OfflineState {
  // ネットワーク状態
  networkStatus: NetworkStatus;
  isOfflineMode: boolean;
  
  // 同期状態
  syncStatus: SyncStatus;
  
  // ローカルデータ
  localTenkoRecords: LocalTenkoRecord[];
  localVehicles: LocalVehicle[];
  localUserProfile: LocalUserProfile | null;
  
  // 同期キュー
  syncQueue: SyncQueueItem[];
  
  // アプリ設定
  appSettings: AppSettings;
  
  // 統計情報
  dataStats: LocalDataStats;
  
  // UI状態
  showOfflineIndicator: boolean;
  showSyncProgress: boolean;
  lastUserAction: string | null;
}

interface OfflineActions {
  // 初期化
  initialize: () => Promise<void>;
  
  // ネットワーク状態の更新
  updateNetworkStatus: (status: NetworkStatus) => void;
  setOfflineMode: (enabled: boolean) => void;
  
  // 同期状態の管理
  updateSyncStatus: (status: Partial<SyncStatus>) => void;
  addSyncError: (error: Omit<SyncError, 'id' | 'timestamp'>) => void;
  clearSyncError: (errorId: string) => void;
  clearAllSyncErrors: () => void;
  
  // ローカルデータの管理
  loadLocalData: () => Promise<void>;
  saveLocalTenkoRecord: (record: LocalTenkoRecord) => Promise<void>;
  updateLocalTenkoRecord: (localId: string, updates: Partial<LocalTenkoRecord>) => Promise<void>;
  deleteLocalTenkoRecord: (localId: string) => Promise<void>;
  
  saveLocalVehicle: (vehicle: LocalVehicle) => Promise<void>;
  updateLocalVehicle: (id: string, updates: Partial<LocalVehicle>) => Promise<void>;
  deleteLocalVehicle: (id: string) => Promise<void>;
  
  updateLocalUserProfile: (profile: Partial<LocalUserProfile>) => Promise<void>;
  
  // 同期キューの管理
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retry_count'>) => Promise<void>;
  updateSyncQueueItem: (id: string, updates: Partial<SyncQueueItem>) => Promise<void>;
  removeSyncQueueItem: (id: string) => Promise<void>;
  loadSyncQueue: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  
  // アプリ設定の管理
  loadAppSettings: () => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // 統計情報の更新
  updateDataStats: () => Promise<void>;
  
  // UI状態の管理
  setShowOfflineIndicator: (show: boolean) => void;
  setShowSyncProgress: (show: boolean) => void;
  setLastUserAction: (action: string) => void;
  
  // ユーティリティ
  isDataAvailableOffline: (dataType: 'tenko_records' | 'vehicles' | 'user_profile') => boolean;
  getPendingSyncCount: () => number;
  getFailedSyncCount: () => number;
  shouldShowOfflineWarning: () => boolean;
  generateLocalId: () => string;
  
  // 自動同期
  triggerAutoSync: () => Promise<void>;
  
  // データクリーンアップ
  cleanupOldData: (olderThanDays: number) => Promise<void>;
  compactData: () => Promise<void>;
}

const initialNetworkStatus: NetworkStatus = {
  isConnected: false,
  type: null,
  isInternetReachable: null,
  connectionQuality: 'unknown',
};

const initialSyncStatus: SyncStatus = {
  is_syncing: false,
  pending_items_count: 0,
  failed_items_count: 0,
  network_available: false,
  errors: [],
};

const initialAppSettings: AppSettings = {
  offline_mode_enabled: true,
  auto_sync_enabled: true,
  sync_on_wifi_only: false,
  max_offline_storage_days: 30,
  sync_interval_minutes: 15,
  retry_failed_sync: true,
  max_sync_retries: 3,
  user_preferences: {
    default_check_method: '対面',
    default_executor: '本人',
    default_alcohol_level: '0.00',
    default_health_status: 'good',
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
    backup_frequency_days: 7,
  },
};

const initialDataStats: LocalDataStats = {
  tenko_records: {
    total: 0,
    synced: 0,
    pending: 0,
    failed: 0,
  },
  vehicles: {
    total: 0,
    synced: 0,
    pending: 0,
  },
  sync_queue: {
    total_items: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
    failed_items: 0,
  },
  storage_info: {
    total_size_bytes: 0,
    item_count: 0,
  },
};

export const useOfflineStore = create<OfflineState & OfflineActions>()(
  subscribeWithSelector((set, get) => ({
    // 初期状態
    networkStatus: initialNetworkStatus,
    isOfflineMode: false,
    syncStatus: initialSyncStatus,
    localTenkoRecords: [],
    localVehicles: [],
    localUserProfile: null,
    syncQueue: [],
    appSettings: initialAppSettings,
    dataStats: initialDataStats,
    showOfflineIndicator: false,
    showSyncProgress: false,
    lastUserAction: null,

    // 初期化
    initialize: async () => {
      try {
        console.log('🔄 オフラインストア初期化開始');
        
        // ネットワーク状態の監視開始
        const networkManager = getNetworkManager();
        networkManager.addListener((status) => {
          get().updateNetworkStatus(status);
        });
        
        // ローカルデータの読み込み
        await get().loadLocalData();
        await get().loadSyncQueue();
        await get().loadAppSettings();
        await get().updateDataStats();
        
        console.log('✅ オフラインストア初期化完了');
      } catch (error) {
        console.error('❌ オフラインストア初期化エラー:', error);
      }
    },

    // ネットワーク状態の更新
    updateNetworkStatus: (status) => {
      const previousStatus = get().networkStatus;
      const wasConnected = previousStatus.isConnected;
      const isNowConnected = status.isConnected;
      
      set((state) => ({
        networkStatus: status,
        isOfflineMode: !isNowConnected,
        syncStatus: {
          ...state.syncStatus,
          network_available: isNowConnected,
        },
        showOfflineIndicator: !isNowConnected,
      }));

      // 接続状態が変化した場合の処理
      if (!wasConnected && isNowConnected) {
        console.log('🟢 ネットワーク復旧 - 自動同期開始');
        // 自動同期の開始
        setTimeout(() => {
          get().triggerAutoSync();
        }, 1000); // 1秒待ってから同期開始
      } else if (wasConnected && !isNowConnected) {
        console.log('🔴 ネットワーク切断 - オフラインモード開始');
      }
    },

    setOfflineMode: (enabled) => {
      set({ isOfflineMode: enabled });
      console.log(`📱 オフラインモード: ${enabled ? '有効' : '無効'}`);
    },

    // 同期状態の管理
    updateSyncStatus: (statusUpdate) => {
      set((state) => ({
        syncStatus: { ...state.syncStatus, ...statusUpdate },
      }));
    },

    addSyncError: (errorData) => {
      const newError: SyncError = {
        ...errorData,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          errors: [...state.syncStatus.errors, newError],
        },
      }));

      console.error('🚨 同期エラー追加:', newError);
    },

    clearSyncError: (errorId) => {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          errors: state.syncStatus.errors.filter(error => error.id !== errorId),
        },
      }));
    },

    clearAllSyncErrors: () => {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          errors: [],
        },
      }));
    },

    // ローカルデータの読み込み
    loadLocalData: async () => {
      try {
        const [tenkoRecords, vehicles, userProfile] = await Promise.all([
          LocalStorageService.getTenkoRecords(),
          LocalStorageService.getVehicles(),
          LocalStorageService.getUserProfile(),
        ]);

        set({
          localTenkoRecords: tenkoRecords,
          localVehicles: vehicles,
          localUserProfile: userProfile,
        });

        console.log('📊 ローカルデータ読み込み完了:', {
          tenkoRecords: tenkoRecords.length,
          vehicles: vehicles.length,
          hasProfile: !!userProfile,
        });
      } catch (error) {
        console.error('❌ ローカルデータ読み込みエラー:', error);
      }
    },

    // 点呼記録の管理
    saveLocalTenkoRecord: async (record) => {
      try {
        await LocalStorageService.saveTenkoRecord(record);
        
        set((state) => {
          const existingIndex = state.localTenkoRecords.findIndex(r => r.local_id === record.local_id);
          const newRecords = [...state.localTenkoRecords];
          
          if (existingIndex >= 0) {
            newRecords[existingIndex] = record;
          } else {
            newRecords.push(record);
          }
          
          return { localTenkoRecords: newRecords };
        });

        // 同期キューに追加
        if (!record.is_synced) {
          await get().addToSyncQueue({
            type: 'tenko_record',
            action: 'create',
            data: record,
            priority: 'high',
            max_retries: 3,
          });
        }

        await get().updateDataStats();
        console.log('💾 点呼記録保存完了:', record.local_id);
      } catch (error) {
        console.error('❌ 点呼記録保存エラー:', error);
        throw error;
      }
    },

    updateLocalTenkoRecord: async (localId, updates) => {
      try {
        const state = get();
        const recordIndex = state.localTenkoRecords.findIndex(r => r.local_id === localId);
        
        if (recordIndex < 0) {
          throw new Error(`点呼記録が見つかりません: ${localId}`);
        }

        const updatedRecord = {
          ...state.localTenkoRecords[recordIndex],
          ...updates,
          updated_at_local: new Date().toISOString(),
          is_synced: false, // 更新されたので未同期に
        };

        await LocalStorageService.saveTenkoRecord(updatedRecord);
        
        set((state) => {
          const newRecords = [...state.localTenkoRecords];
          newRecords[recordIndex] = updatedRecord;
          return { localTenkoRecords: newRecords };
        });

        // 同期キューに追加
        await get().addToSyncQueue({
          type: 'tenko_record',
          action: 'update',
          data: updatedRecord,
          priority: 'medium',
          max_retries: 3,
        });

        await get().updateDataStats();
        console.log('✏️ 点呼記録更新完了:', localId);
      } catch (error) {
        console.error('❌ 点呼記録更新エラー:', error);
        throw error;
      }
    },

    deleteLocalTenkoRecord: async (localId) => {
      try {
        await LocalStorageService.deleteTenkoRecord(localId);
        
        const deletedRecord = get().localTenkoRecords.find(r => r.local_id === localId);
        
        set((state) => ({
          localTenkoRecords: state.localTenkoRecords.filter(r => r.local_id !== localId),
        }));

        // サーバーからも削除が必要な場合は同期キューに追加
        if (deletedRecord?.server_id) {
          await get().addToSyncQueue({
            type: 'tenko_record',
            action: 'delete',
            data: { server_id: deletedRecord.server_id },
            priority: 'low',
            max_retries: 3,
          });
        }

        await get().updateDataStats();
        console.log('🗑️ 点呼記録削除完了:', localId);
      } catch (error) {
        console.error('❌ 点呼記録削除エラー:', error);
        throw error;
      }
    },

    // 車両の管理
    saveLocalVehicle: async (vehicle) => {
      try {
        await LocalStorageService.saveVehicle(vehicle);
        
        set((state) => {
          const existingIndex = state.localVehicles.findIndex(v => v.id === vehicle.id);
          const newVehicles = [...state.localVehicles];
          
          if (existingIndex >= 0) {
            newVehicles[existingIndex] = vehicle;
          } else {
            newVehicles.push(vehicle);
          }
          
          return { localVehicles: newVehicles };
        });

        if (!vehicle.is_synced) {
          await get().addToSyncQueue({
            type: 'vehicle',
            action: 'create',
            data: vehicle,
            priority: 'medium',
            max_retries: 3,
          });
        }

        await get().updateDataStats();
        console.log('🚗 車両保存完了:', vehicle.id);
      } catch (error) {
        console.error('❌ 車両保存エラー:', error);
        throw error;
      }
    },

    updateLocalVehicle: async (id, updates) => {
      try {
        const state = get();
        const vehicleIndex = state.localVehicles.findIndex(v => v.id === id);
        
        if (vehicleIndex < 0) {
          throw new Error(`車両が見つかりません: ${id}`);
        }

        const updatedVehicle = {
          ...state.localVehicles[vehicleIndex],
          ...updates,
          updated_at_local: new Date().toISOString(),
          is_synced: false,
        };

        await LocalStorageService.saveVehicle(updatedVehicle);
        
        set((state) => {
          const newVehicles = [...state.localVehicles];
          newVehicles[vehicleIndex] = updatedVehicle;
          return { localVehicles: newVehicles };
        });

        await get().addToSyncQueue({
          type: 'vehicle',
          action: 'update',
          data: updatedVehicle,
          priority: 'medium',
          max_retries: 3,
        });

        await get().updateDataStats();
        console.log('✏️ 車両更新完了:', id);
      } catch (error) {
        console.error('❌ 車両更新エラー:', error);
        throw error;
      }
    },

    deleteLocalVehicle: async (id) => {
      try {
        const deletedVehicle = get().localVehicles.find(v => v.id === id);
        
        set((state) => ({
          localVehicles: state.localVehicles.filter(v => v.id !== id),
        }));

        if (deletedVehicle?.server_id) {
          await get().addToSyncQueue({
            type: 'vehicle',
            action: 'delete',
            data: { server_id: deletedVehicle.server_id },
            priority: 'low',
            max_retries: 3,
          });
        }

        await get().updateDataStats();
        console.log('🗑️ 車両削除完了:', id);
      } catch (error) {
        console.error('❌ 車両削除エラー:', error);
        throw error;
      }
    },

    // ユーザープロフィールの更新
    updateLocalUserProfile: async (profileUpdates) => {
      try {
        const currentProfile = get().localUserProfile;
        if (!currentProfile) {
          throw new Error('ユーザープロフィールが見つかりません');
        }

        const updatedProfile = {
          ...currentProfile,
          ...profileUpdates,
          updated_at_local: new Date().toISOString(),
          is_synced: false,
        };

        await LocalStorageService.saveUserProfile(updatedProfile);
        
        set({ localUserProfile: updatedProfile });

        await get().addToSyncQueue({
          type: 'user_profile',
          action: 'update',
          data: updatedProfile,
          priority: 'medium',
          max_retries: 3,
        });

        console.log('👤 ユーザープロフィール更新完了');
      } catch (error) {
        console.error('❌ ユーザープロフィール更新エラー:', error);
        throw error;
      }
    },

    // 同期キューの管理
    addToSyncQueue: async (itemData) => {
      try {
        const newItem: SyncQueueItem = {
          ...itemData,
          id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          retry_count: 0,
        };

        await LocalStorageService.addToSyncQueue(newItem);
        
        set((state) => ({
          syncQueue: [...state.syncQueue, newItem],
        }));

        await get().updateDataStats();
        console.log('➕ 同期キューに追加:', newItem.id);
      } catch (error) {
        console.error('❌ 同期キュー追加エラー:', error);
        throw error;
      }
    },

    updateSyncQueueItem: async (id, updates) => {
      try {
        await LocalStorageService.updateSyncQueueItem(id, updates);
        
        set((state) => ({
          syncQueue: state.syncQueue.map(item => 
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        await get().updateDataStats();
      } catch (error) {
        console.error('❌ 同期キューアイテム更新エラー:', error);
        throw error;
      }
    },

    removeSyncQueueItem: async (id) => {
      try {
        await LocalStorageService.removeSyncQueueItem(id);
        
        set((state) => ({
          syncQueue: state.syncQueue.filter(item => item.id !== id),
        }));

        await get().updateDataStats();
        console.log('➖ 同期キューから削除:', id);
      } catch (error) {
        console.error('❌ 同期キューアイテム削除エラー:', error);
        throw error;
      }
    },

    loadSyncQueue: async () => {
      try {
        const queue = await LocalStorageService.getSyncQueue();
        set({ syncQueue: queue });
        console.log('📋 同期キュー読み込み完了:', queue.length);
      } catch (error) {
        console.error('❌ 同期キュー読み込みエラー:', error);
      }
    },

    clearSyncQueue: async () => {
      try {
        await LocalStorageService.clearSyncQueue();
        set({ syncQueue: [] });
        await get().updateDataStats();
        console.log('🧹 同期キュークリア完了');
      } catch (error) {
        console.error('❌ 同期キュークリアエラー:', error);
        throw error;
      }
    },

    // アプリ設定の管理
    loadAppSettings: async () => {
      try {
        const settings = await LocalStorageService.getAppSettings();
        set({ appSettings: settings });
        console.log('⚙️ アプリ設定読み込み完了');
      } catch (error) {
        console.error('❌ アプリ設定読み込みエラー:', error);
      }
    },

    updateAppSettings: async (settingsUpdate) => {
      try {
        const newSettings = { ...get().appSettings, ...settingsUpdate };
        await LocalStorageService.updateAppSettings(settingsUpdate);
        set({ appSettings: newSettings });
        console.log('⚙️ アプリ設定更新完了');
      } catch (error) {
        console.error('❌ アプリ設定更新エラー:', error);
        throw error;
      }
    },

    // 統計情報の更新
    updateDataStats: async () => {
      try {
        const state = get();
        const storageInfo = await LocalStorageService.getStorageInfo();

        const tenkoStats = state.localTenkoRecords.reduce(
          (acc, record) => {
            acc.total++;
            if (record.is_synced) acc.synced++;
            else if (record.sync_error) acc.failed++;
            else acc.pending++;
            return acc;
          },
          { total: 0, synced: 0, pending: 0, failed: 0 }
        );

        const vehicleStats = state.localVehicles.reduce(
          (acc, vehicle) => {
            acc.total++;
            if (vehicle.is_synced) acc.synced++;
            else acc.pending++;
            return acc;
          },
          { total: 0, synced: 0, pending: 0 }
        );

        const queueStats = state.syncQueue.reduce(
          (acc, item) => {
            acc.total_items++;
            if (item.priority === 'high') acc.high_priority++;
            else if (item.priority === 'medium') acc.medium_priority++;
            else acc.low_priority++;
            if (item.last_error) acc.failed_items++;
            return acc;
          },
          { total_items: 0, high_priority: 0, medium_priority: 0, low_priority: 0, failed_items: 0 }
        );

        const newStats: LocalDataStats = {
          tenko_records: {
            ...tenkoStats,
            oldest_date: state.localTenkoRecords.length > 0 
              ? state.localTenkoRecords.reduce((oldest, record) => 
                  record.date < oldest ? record.date : oldest, 
                  state.localTenkoRecords[0].date
                )
              : undefined,
            newest_date: state.localTenkoRecords.length > 0
              ? state.localTenkoRecords.reduce((newest, record) => 
                  record.date > newest ? record.date : newest, 
                  state.localTenkoRecords[0].date
                )
              : undefined,
          },
          vehicles: vehicleStats,
          sync_queue: queueStats,
          storage_info: storageInfo,
        };

        set({ dataStats: newStats });
      } catch (error) {
        console.error('❌ 統計情報更新エラー:', error);
      }
    },

    // UI状態の管理
    setShowOfflineIndicator: (show) => set({ showOfflineIndicator: show }),
    setShowSyncProgress: (show) => set({ showSyncProgress: show }),
    setLastUserAction: (action) => set({ lastUserAction: action }),

    // ユーティリティ
    isDataAvailableOffline: (dataType) => {
      const state = get();
      switch (dataType) {
        case 'tenko_records':
          return state.localTenkoRecords.length > 0;
        case 'vehicles':
          return state.localVehicles.length > 0;
        case 'user_profile':
          return !!state.localUserProfile;
        default:
          return false;
      }
    },

    getPendingSyncCount: () => {
      return get().syncQueue.length;
    },

    getFailedSyncCount: () => {
      return get().syncQueue.filter(item => item.last_error).length;
    },

    shouldShowOfflineWarning: () => {
      const state = get();
      return !state.networkStatus.isConnected && state.getPendingSyncCount() > 0;
    },

    generateLocalId: () => {
      return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // 自動同期
    triggerAutoSync: async () => {
      const state = get();
      
      // 既に同期中の場合はスキップ
      if (state.syncStatus.is_syncing) {
        console.log('🔄 既に同期処理中のためスキップ');
        return;
      }
      
      // ネットワーク未接続の場合はスキップ
      if (!state.networkStatus.isConnected) {
        console.log('🔴 ネットワーク未接続のため同期スキップ');
        return;
      }
      
      // 同期待ちアイテムがない場合はスキップ
      if (state.syncQueue.length === 0) {
        console.log('📭 同期待ちアイテムなし');
        return;
      }
      
      try {
        // 同期状態を開始に設定
        get().updateSyncStatus({
          is_syncing: true,
          last_sync_attempt: new Date().toISOString(),
          sync_progress: {
            total_items: state.syncQueue.length,
            completed_items: 0,
            current_operation: '同期準備中...',
          },
        });
        
        console.log(`🚀 自動同期開始: ${state.syncQueue.length}件のアイテム`);
        
        // 優先度順でソート（high -> medium -> low）
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const sortedQueue = [...state.syncQueue].sort((a, b) => 
          priorityOrder[b.priority] - priorityOrder[a.priority]
        );
        
        let completedCount = 0;
        const errors: string[] = [];
        
        for (const item of sortedQueue) {
          try {
            // 同期進捗を更新
            get().updateSyncStatus({
              sync_progress: {
                total_items: sortedQueue.length,
                completed_items: completedCount,
                current_operation: `${item.type}を同期中...`,
              },
            });
            
            // 実際の同期処理（サーバーAPI呼び出し）
            const { SyncService } = await import('@/services/syncService');
            
            if (item.type === 'tenko_record') {
              await SyncService.syncTenkoRecord(item);
            } else if (item.type === 'vehicle') {
              await SyncService.syncVehicle(item);
            } else if (item.type === 'user_profile') {
              await SyncService.syncUserProfile(item);
            } else {
              throw new Error(`未対応の同期タイプ: ${item.type}`);
            }
            
            console.log(`✅ 同期完了: ${item.type} (${item.id})`);
            
            // 成功したアイテムを同期キューから削除
            await get().removeSyncQueueItem(item.id);
            
            completedCount++;
            
            // 少し間隔をあける
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (itemError) {
            const errorMessage = itemError instanceof Error ? itemError.message : '不明なエラー';
            console.error(`❌ 同期失敗: ${item.type} (${item.id})`, errorMessage);
            
            errors.push(`${item.type}: ${errorMessage}`);
            
            // エラータイプを判定してリトライ可否を決定
            const { SyncService } = await import('@/services/syncService');
            const isRetryable = SyncService.isRetryableError(itemError);
            const currentRetryCount = (item.retry_count || 0) + 1;
            
            if (isRetryable && currentRetryCount < (item.max_retries || 3)) {
              // リトライ可能な場合は再試行
              await get().updateSyncQueueItem(item.id, {
                retry_count: currentRetryCount,
                last_error: errorMessage,
              });
            } else {
              // リトライ上限に達した場合は失敗としてマーク
              await get().updateSyncQueueItem(item.id, {
                retry_count: currentRetryCount,
                last_error: errorMessage,
                failed_at: new Date().toISOString(),
              });
            }
          }
        }
        
        // 同期完了
        get().updateSyncStatus({
          is_syncing: false,
          last_successful_sync: new Date().toISOString(),
          sync_progress: undefined,
        });
        
        // エラーがあった場合は記録
        if (errors.length > 0) {
          errors.forEach(error => {
            get().addSyncError({
              error_type: 'sync',
              error_message: error,
              retry_count: 0,
              is_resolved: false,
            });
          });
        }
        
        // データ統計を更新
        await get().updateDataStats();
        
        console.log(`🎉 自動同期完了: ${completedCount}件成功, ${errors.length}件失敗`);
        
      } catch (error) {
        console.error('❌ 自動同期エラー:', error);
        
        get().updateSyncStatus({
          is_syncing: false,
          sync_progress: undefined,
        });
        
        get().addSyncError({
          error_type: 'sync',
          error_message: error instanceof Error ? error.message : '自動同期に失敗しました',
          retry_count: 0,
          is_resolved: false,
        });
      }
    },

    // データクリーンアップ
    cleanupOldData: async (olderThanDays) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        const state = get();
        const recordsToKeep = state.localTenkoRecords.filter(record => record.date >= cutoffString);
        
        // 削除される記録数
        const deletedCount = state.localTenkoRecords.length - recordsToKeep.length;
        
        if (deletedCount > 0) {
          await LocalStorageService.setItem('tenko_records', recordsToKeep);
          set({ localTenkoRecords: recordsToKeep });
          
          await get().updateDataStats();
          console.log(`🧹 古いデータクリーンアップ完了: ${deletedCount}件削除`);
        }
      } catch (error) {
        console.error('❌ データクリーンアップエラー:', error);
        throw error;
      }
    },

    compactData: async () => {
      try {
        // 重複する同期キューアイテムの除去
        const state = get();
        const uniqueQueueItems = state.syncQueue.filter((item, index, array) => 
          array.findIndex(i => i.type === item.type && i.data.local_id === item.data.local_id) === index
        );

        if (uniqueQueueItems.length !== state.syncQueue.length) {
          await LocalStorageService.setItem('sync_queue', uniqueQueueItems);
          set({ syncQueue: uniqueQueueItems });
          
          const removedCount = state.syncQueue.length - uniqueQueueItems.length;
          console.log(`🗜️ データ圧縮完了: ${removedCount}件の重複削除`);
        }

        await get().updateDataStats();
      } catch (error) {
        console.error('❌ データ圧縮エラー:', error);
        throw error;
      }
    },
  }))
);

// セレクター
export const useNetworkStatus = () => useOfflineStore((state) => state.networkStatus);
export const useIsOffline = () => useOfflineStore((state) => state.isOfflineMode);
export const useSyncStatus = () => useOfflineStore((state) => state.syncStatus);
export const useLocalTenkoRecords = () => useOfflineStore((state) => state.localTenkoRecords);
export const useLocalVehicles = () => useOfflineStore((state) => state.localVehicles);
export const usePendingSyncCount = () => useOfflineStore((state) => state.getPendingSyncCount());
export const useDataStats = () => useOfflineStore((state) => state.dataStats);