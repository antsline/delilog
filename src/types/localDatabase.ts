import { TenkoRecord, Vehicle, UserProfile } from './database';
import { NetInfoStateType } from '@react-native-community/netinfo';

// ネットワーク関連
export interface NetworkStatus {
  isConnected: boolean;
  type: NetInfoStateType | null;
  isInternetReachable: boolean | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
}

// ローカルストレージ用の基本型
export interface LocalEntity {
  is_synced: boolean;
  created_at_local: string;
  updated_at_local: string;
  sync_error?: string;
}

// ローカル点呼記録
export interface LocalTenkoRecord extends Omit<TenkoRecord, 'id' | 'created_at' | 'updated_at'>, LocalEntity {
  local_id: string;
  server_id?: string; // サーバー同期後に設定
  is_offline_created: boolean;
}

// ローカル車両情報
export interface LocalVehicle extends Omit<Vehicle, 'created_at' | 'updated_at'>, LocalEntity {
  server_id?: string;
}

// ローカルユーザープロフィール
export interface LocalUserProfile extends UserProfile, LocalEntity {
  last_server_sync?: string;
}

// 同期キューのアイテム
export interface SyncQueueItem {
  id: string;
  type: 'tenko_record' | 'vehicle' | 'user_profile';
  action: 'create' | 'update' | 'delete';
  data: any;
  local_id?: string;
  server_id?: string;
  timestamp: string;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  failed_at?: string;
  priority: 'high' | 'medium' | 'low';
}

// オフライン操作のログ
export interface OfflineOperationLog {
  id: string;
  operation_type: 'create' | 'update' | 'delete';
  entity_type: 'tenko_record' | 'vehicle' | 'user_profile';
  entity_id: string;
  data_snapshot: any;
  timestamp: string;
  user_id: string;
  is_synced: boolean;
  sync_error?: string;
}

// アプリケーション設定
export interface AppSettings {
  // オフライン設定
  offline_mode_enabled: boolean;
  auto_sync_enabled: boolean;
  sync_on_wifi_only: boolean;
  max_offline_storage_days: number;
  
  // 同期設定
  sync_interval_minutes: number;
  retry_failed_sync: boolean;
  max_sync_retries: number;
  
  // ユーザー設定
  user_preferences: {
    default_check_method: string;
    default_executor: string;
    default_alcohol_level: string;
    default_health_status: 'good' | 'caution' | 'poor';
    default_daily_check: boolean;
  };
  
  // 通知設定
  notification_settings: {
    enabled: boolean;
    tenko_reminder_enabled: boolean;
    sync_failure_alert: boolean;
    offline_mode_alert: boolean;
  };
  
  // データ管理
  data_management: {
    last_backup_date?: string;
    auto_backup_enabled: boolean;
    backup_frequency_days: number;
    last_cleanup_date?: string;
  };
  
  // デバッグ設定
  debug_settings?: {
    enable_detailed_logs: boolean;
    log_network_events: boolean;
    log_sync_operations: boolean;
  };
}

// 同期状態の詳細情報
export interface SyncStatus {
  is_syncing: boolean;
  last_sync_attempt?: string;
  last_successful_sync?: string;
  pending_items_count: number;
  failed_items_count: number;
  network_available: boolean;
  sync_progress?: {
    total_items: number;
    completed_items: number;
    current_operation?: string;
  };
  errors: SyncError[];
}

// 同期エラーの詳細
export interface SyncError {
  id: string;
  timestamp: string;
  error_type: 'network' | 'server' | 'data' | 'auth' | 'sync' | 'unknown';
  error_message: string;
  entity_type?: string;
  entity_id?: string;
  retry_count: number;
  is_resolved: boolean;
  resolution_timestamp?: string;
}

// データ統計情報
export interface LocalDataStats {
  tenko_records: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
    oldest_date?: string;
    newest_date?: string;
  };
  vehicles: {
    total: number;
    synced: number;
    pending: number;
  };
  sync_queue: {
    total_items: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    failed_items: number;
  };
  storage_info: {
    total_size_bytes: number;
    item_count: number;
    last_cleanup?: string;
  };
}

// データの競合解決
export interface ConflictResolution {
  id: string;
  entity_type: string;
  local_data: any;
  server_data: any;
  resolution_strategy: 'use_local' | 'use_server' | 'merge' | 'user_choice';
  resolved_data?: any;
  timestamp: string;
  resolved_by: 'auto' | 'user';
}

// バックアップデータの構造
export interface BackupData {
  version: string;
  timestamp: string;
  user_id: string;
  data: {
    tenko_records: LocalTenkoRecord[];
    vehicles: LocalVehicle[];
    user_profile: LocalUserProfile;
    app_settings: AppSettings;
    sync_queue: SyncQueueItem[];
    operation_logs: OfflineOperationLog[];
  };
  metadata: {
    total_records: number;
    date_range: {
      start: string;
      end: string;
    };
    app_version: string;
    platform: string;
  };
}

// ローカルストレージキー
export const LOCAL_STORAGE_KEYS = {
  TENKO_RECORDS: 'tenko_records',
  VEHICLES: 'vehicles',
  USER_PROFILE: 'user_profile',
  SYNC_QUEUE: 'sync_queue',
  OPERATION_LOGS: 'operation_logs',
  APP_SETTINGS: 'app_settings',
  SYNC_STATUS: 'sync_status',
  LAST_SYNC: 'last_sync',
  NETWORK_STATUS: 'network_status',
  BACKUP_METADATA: 'backup_metadata',
} as const;

// ローカルストレージのバージョン管理
export interface LocalStorageVersion {
  version: string;
  migration_needed: boolean;
  last_migration?: string;
}

// データ移行の定義
export interface DataMigration {
  from_version: string;
  to_version: string;
  migration_steps: MigrationStep[];
}

export interface MigrationStep {
  step_number: number;
  description: string;
  operation: 'add_field' | 'remove_field' | 'rename_field' | 'transform_data' | 'create_index';
  target_key: string;
  parameters: any;
}

// エクスポート用のデータフォーマット
export interface ExportData {
  format: 'json' | 'csv' | 'pdf';
  date_range: {
    start: string;
    end: string;
  };
  include_types: ('tenko_records' | 'vehicles' | 'user_profile')[];
  filters?: {
    vehicle_ids?: string[];
    record_types?: ('before' | 'after')[];
    status_filter?: 'all' | 'synced' | 'pending' | 'failed';
  };
  export_settings: {
    include_metadata: boolean;
    compress: boolean;
    encrypt: boolean;
  };
}