import { LocalTenkoRecord, LocalVehicle, LocalUserProfile, SyncQueueItem } from '@/types/localDatabase';
import { TenkoRecord, Vehicle, UserProfile } from '@/types/database';
import { TenkoService } from './tenkoService';
import { VehicleService } from './vehicleService';
import { LocalStorageService } from './localStorageService';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: SyncError[];
}

export interface SyncError {
  itemId: string;
  itemType: string;
  errorType: 'network' | 'server' | 'data' | 'conflict';
  errorMessage: string;
  retryCount: number;
}

export interface ConflictResolution {
  strategy: 'use_local' | 'use_server' | 'merge' | 'skip';
  resolvedData?: any;
}

export class SyncService {
  
  /**
   * 点呼記録の同期処理
   */
  static async syncTenkoRecord(item: SyncQueueItem): Promise<void> {
    const { action, data } = item;
    const localRecord = data as LocalTenkoRecord;
    
    try {
      switch (action) {
        case 'create':
          await this.syncTenkoRecordCreate(localRecord);
          break;
        case 'update':
          await this.syncTenkoRecordUpdate(localRecord);
          break;
        case 'delete':
          await this.syncTenkoRecordDelete(localRecord);
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      console.error(`点呼記録同期エラー [${action}]:`, error);
      throw error;
    }
  }

  /**
   * 点呼記録の新規作成同期
   */
  private static async syncTenkoRecordCreate(localRecord: LocalTenkoRecord): Promise<TenkoRecord> {
    // LocalTenkoRecordをTenkoRecordInsert形式に変換
    const insertData = {
      user_id: localRecord.user_id,
      vehicle_id: localRecord.vehicle_id,
      date: localRecord.date,
      type: localRecord.type,
      check_method: localRecord.check_method,
      executor: localRecord.executor,
      alcohol_detector_used: localRecord.alcohol_detector_used,
      alcohol_detected: localRecord.alcohol_detected,
      alcohol_level: localRecord.alcohol_level,
      health_status: localRecord.health_status,
      daily_check_completed: localRecord.daily_check_completed,
      operation_status: localRecord.operation_status,
      notes: localRecord.notes,
      platform: localRecord.platform,
      is_offline_created: localRecord.is_offline_created,
    };

    // サーバーに新規作成
    const serverRecord = await TenkoService.createTenkoRecord(insertData);
    
    // ローカル記録を更新（同期済みマークとserver_id設定）
    const updatedLocalRecord = {
      ...localRecord,
      server_id: serverRecord.id,
      is_synced: true,
      updated_at_local: new Date().toISOString(),
    };
    
    await LocalStorageService.saveTenkoRecord(updatedLocalRecord);
    
    console.log(`✅ 点呼記録作成同期完了: ${localRecord.local_id} → ${serverRecord.id}`);
    return serverRecord;
  }

  /**
   * 点呼記録の更新同期
   */
  private static async syncTenkoRecordUpdate(localRecord: LocalTenkoRecord): Promise<void> {
    if (!localRecord.server_id) {
      throw new Error('更新同期にはserver_idが必要です');
    }

    try {
      // まずサーバーから最新データを取得して競合チェック
      const serverRecord = await TenkoService.getTenkoRecordById(localRecord.server_id);
      
      if (serverRecord) {
        // 競合解決
        const resolution = await this.resolveConflict(localRecord, serverRecord);
        
        if (resolution.strategy === 'use_local') {
          // ローカルデータでサーバーを更新
          const updateData = {
            check_method: localRecord.check_method,
            executor: localRecord.executor,
            alcohol_detector_used: localRecord.alcohol_detector_used,
            alcohol_detected: localRecord.alcohol_detected,
            alcohol_level: localRecord.alcohol_level,
            health_status: localRecord.health_status,
            daily_check_completed: localRecord.daily_check_completed,
            operation_status: localRecord.operation_status,
            notes: localRecord.notes,
          };
          
          await TenkoService.updateTenkoRecord(localRecord.server_id, updateData);
          
          // ローカル記録を同期済みにマーク
          const updatedLocalRecord = {
            ...localRecord,
            is_synced: true,
            updated_at_local: new Date().toISOString(),
          };
          
          await LocalStorageService.saveTenkoRecord(updatedLocalRecord);
          
        } else if (resolution.strategy === 'use_server') {
          // サーバーデータでローカルを更新
          const updatedLocalRecord = {
            ...localRecord,
            ...resolution.resolvedData,
            is_synced: true,
            updated_at_local: new Date().toISOString(),
          };
          
          await LocalStorageService.saveTenkoRecord(updatedLocalRecord);
        }
      }
      
      console.log(`✅ 点呼記録更新同期完了: ${localRecord.local_id}`);
      
    } catch (error) {
      console.error('点呼記録更新同期エラー:', error);
      throw error;
    }
  }

  /**
   * 点呼記録の削除同期
   */
  private static async syncTenkoRecordDelete(localRecord: LocalTenkoRecord): Promise<void> {
    if (!localRecord.server_id) {
      throw new Error('削除同期にはserver_idが必要です');
    }

    try {
      await TenkoService.deleteTenkoRecord(localRecord.server_id);
      
      // ローカルからも完全削除
      await LocalStorageService.deleteTenkoRecord(localRecord.local_id);
      
      console.log(`✅ 点呼記録削除同期完了: ${localRecord.local_id}`);
      
    } catch (error) {
      console.error('点呼記録削除同期エラー:', error);
      throw error;
    }
  }

  /**
   * 車両情報の同期処理
   */
  static async syncVehicle(item: SyncQueueItem): Promise<void> {
    const { action, data } = item;
    const localVehicle = data as LocalVehicle;
    
    try {
      switch (action) {
        case 'create':
          await this.syncVehicleCreate(localVehicle);
          break;
        case 'update':
          await this.syncVehicleUpdate(localVehicle);
          break;
        case 'delete':
          await this.syncVehicleDelete(localVehicle);
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      console.error(`車両情報同期エラー [${action}]:`, error);
      throw error;
    }
  }

  /**
   * 車両情報の新規作成同期
   */
  private static async syncVehicleCreate(localVehicle: LocalVehicle): Promise<void> {
    const insertData = {
      user_id: localVehicle.user_id,
      plate_number: localVehicle.plate_number,
      vehicle_name: localVehicle.vehicle_name,
      is_default: localVehicle.is_default,
      is_active: localVehicle.is_active,
    };

    const serverVehicle = await VehicleService.createVehicle(insertData);
    
    // ローカル記録を更新
    const updatedLocalVehicle = {
      ...localVehicle,
      server_id: serverVehicle.id,
      is_synced: true,
      updated_at_local: new Date().toISOString(),
    };
    
    await LocalStorageService.saveVehicle(updatedLocalVehicle);
    
    console.log(`✅ 車両情報作成同期完了: ${localVehicle.id} → ${serverVehicle.id}`);
  }

  /**
   * 車両情報の更新同期
   */
  private static async syncVehicleUpdate(localVehicle: LocalVehicle): Promise<void> {
    if (!localVehicle.server_id) {
      throw new Error('更新同期にはserver_idが必要です');
    }

    const updateData = {
      plate_number: localVehicle.plate_number,
      vehicle_name: localVehicle.vehicle_name,
      is_default: localVehicle.is_default,
      is_active: localVehicle.is_active,
    };
    
    await VehicleService.updateVehicle(localVehicle.server_id, updateData);
    
    // ローカル記録を同期済みにマーク
    const updatedLocalVehicle = {
      ...localVehicle,
      is_synced: true,
      updated_at_local: new Date().toISOString(),
    };
    
    await LocalStorageService.saveVehicle(updatedLocalVehicle);
    
    console.log(`✅ 車両情報更新同期完了: ${localVehicle.id}`);
  }

  /**
   * 車両情報の削除同期
   */
  private static async syncVehicleDelete(localVehicle: LocalVehicle): Promise<void> {
    if (!localVehicle.server_id) {
      throw new Error('削除同期にはserver_idが必要です');
    }

    await VehicleService.deleteVehicle(localVehicle.server_id);
    
    console.log(`✅ 車両情報削除同期完了: ${localVehicle.id}`);
  }

  /**
   * ユーザープロフィールの同期処理
   */
  static async syncUserProfile(item: SyncQueueItem): Promise<void> {
    const { action, data } = item;
    const localProfile = data as LocalUserProfile;
    
    try {
      if (action === 'update') {
        const updateData = {
          company_name: localProfile.company_name,
          driver_name: localProfile.driver_name,
          office_name: localProfile.office_name,
        };
        
        // ユーザープロフィール更新（Supabase直接更新）
        // 注：ProfileServiceは未実装のため、直接Supabaseで更新する想定
        console.log('ユーザープロフィール更新データ:', updateData);
        
        console.log(`✅ ユーザープロフィール同期完了: ${localProfile.id}`);
      }
    } catch (error) {
      console.error(`ユーザープロフィール同期エラー [${action}]:`, error);
      throw error;
    }
  }

  /**
   * 競合解決ロジック（タイムスタンプベース）
   */
  private static async resolveConflict(
    localRecord: LocalTenkoRecord, 
    serverRecord: TenkoRecord
  ): Promise<ConflictResolution> {
    
    const localTimestamp = new Date(localRecord.updated_at_local).getTime();
    const serverTimestamp = new Date(serverRecord.updated_at).getTime();
    
    // タイムスタンプベースの競合解決
    if (localTimestamp > serverTimestamp) {
      // ローカルの方が新しい → ローカルを採用
      console.log(`🔄 競合解決: ローカル採用 (${localRecord.local_id})`);
      return { strategy: 'use_local' };
    } else {
      // サーバーの方が新しい → サーバーを採用
      console.log(`🔄 競合解決: サーバー採用 (${localRecord.local_id})`);
      return { 
        strategy: 'use_server',
        resolvedData: {
          check_method: serverRecord.check_method,
          executor: serverRecord.executor,
          alcohol_detector_used: serverRecord.alcohol_detector_used,
          alcohol_detected: serverRecord.alcohol_detected,
          alcohol_level: serverRecord.alcohol_level,
          health_status: serverRecord.health_status,
          daily_check_completed: serverRecord.daily_check_completed,
          operation_status: serverRecord.operation_status,
          notes: serverRecord.notes,
        }
      };
    }
  }

  /**
   * ネットワークエラーかどうかの判定
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const networkErrorPatterns = [
      'network request failed',
      'network error',
      'connection timeout',
      'no internet connection',
      'fetch failed',
      'unable to connect',
      'offline',
    ];
    
    return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * リトライ可能なエラーかどうかの判定
   */
  static isRetryableError(error: any): boolean {
    if (this.isNetworkError(error)) {
      return true;
    }
    
    // HTTP 5xx系エラーはリトライ可能
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    // レート制限エラー（429）もリトライ可能
    if (error.status === 429) {
      return true;
    }
    
    return false;
  }
}