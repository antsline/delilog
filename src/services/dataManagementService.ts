/**
 * データ管理サービス
 * アカウント削除、データ削除、データ移行機能
 */

import { supabase } from './supabase';
import { securityService } from './securityService';
import { notificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSecurityStore } from '@/store/securityStore';

export interface DataDeletionOptions {
  includeUserData: boolean;
  includeVehicleData: boolean;
  includeTenkoRecords: boolean;
  includeLocalData: boolean;
  includeSecurityData: boolean;
}

export interface DataExportProgress {
  step: string;
  progress: number; // 0-100
  completed: boolean;
  error?: string;
}

class DataManagementService {
  /**
   * 完全なアカウント削除
   */
  async deleteUserAccount(userId: string, onProgress?: (progress: DataExportProgress) => void): Promise<void> {
    try {
      console.log('🗑️ アカウント削除開始:', userId);
      
      onProgress?.({
        step: 'アカウント削除処理を開始しています...',
        progress: 0,
        completed: false,
      });

      // 1. ローカルデータの削除
      onProgress?.({
        step: 'ローカルデータを削除中...',
        progress: 20,
        completed: false,
      });
      await this.deleteLocalData();

      // 2. サーバーデータの削除（逆参照順序で削除）
      onProgress?.({
        step: 'サーバーデータを削除中...',
        progress: 40,
        completed: false,
      });
      await this.deleteServerData(userId);

      // 3. 認証情報の削除
      onProgress?.({
        step: '認証情報を削除中...',
        progress: 60,
        completed: false,
      });
      await this.deleteAuthData();

      // 4. セキュリティデータの削除
      onProgress?.({
        step: 'セキュリティデータを削除中...',
        progress: 80,
        completed: false,
      });
      await this.deleteSecurityData();

      // 5. 通知データの削除
      onProgress?.({
        step: '通知データを削除中...',
        progress: 90,
        completed: false,
      });
      await this.deleteNotificationData();

      onProgress?.({
        step: 'アカウント削除が完了しました',
        progress: 100,
        completed: true,
      });

      console.log('✅ アカウント削除完了');
    } catch (error) {
      console.error('❌ アカウント削除エラー:', error);
      onProgress?.({
        step: 'アカウント削除でエラーが発生しました',
        progress: 0,
        completed: false,
        error: error instanceof Error ? error.message : '削除処理に失敗しました',
      });
      throw error;
    }
  }

  /**
   * 選択的データ削除
   */
  async deleteSelectedData(
    userId: string, 
    options: DataDeletionOptions,
    onProgress?: (progress: DataExportProgress) => void
  ): Promise<void> {
    try {
      console.log('🗑️ 選択的データ削除開始:', options);
      
      let currentProgress = 0;
      const totalSteps = Object.values(options).filter(Boolean).length;
      const stepProgress = 100 / totalSteps;

      if (options.includeTenkoRecords) {
        onProgress?.({
          step: '点呼記録を削除中...',
          progress: currentProgress,
          completed: false,
        });
        await this.deleteTenkoRecords(userId);
        currentProgress += stepProgress;
      }

      if (options.includeVehicleData) {
        onProgress?.({
          step: '車両データを削除中...',
          progress: currentProgress,
          completed: false,
        });
        await this.deleteVehicleData(userId);
        currentProgress += stepProgress;
      }

      if (options.includeLocalData) {
        onProgress?.({
          step: 'ローカルデータを削除中...',
          progress: currentProgress,
          completed: false,
        });
        await this.deleteLocalData();
        currentProgress += stepProgress;
      }

      if (options.includeSecurityData) {
        onProgress?.({
          step: 'セキュリティデータを削除中...',
          progress: currentProgress,
          completed: false,
        });
        await this.deleteSecurityData();
        currentProgress += stepProgress;
      }

      if (options.includeUserData) {
        onProgress?.({
          step: 'ユーザーデータを削除中...',
          progress: currentProgress,
          completed: false,
        });
        await this.deleteUserData(userId);
        currentProgress += stepProgress;
      }

      onProgress?.({
        step: 'データ削除が完了しました',
        progress: 100,
        completed: true,
      });

      console.log('✅ 選択的データ削除完了');
    } catch (error) {
      console.error('❌ 選択的データ削除エラー:', error);
      onProgress?.({
        step: 'データ削除でエラーが発生しました',
        progress: 0,
        completed: false,
        error: error instanceof Error ? error.message : '削除処理に失敗しました',
      });
      throw error;
    }
  }

  /**
   * ローカルデータの削除
   */
  private async deleteLocalData(): Promise<void> {
    try {
      // AsyncStorageのキーを取得
      const keys = await AsyncStorage.getAllKeys();
      
      // アプリ関連のキーのみフィルタリング
      const appKeys = keys.filter(key => 
        key.startsWith('auth-storage') ||
        key.startsWith('offline-storage') ||
        key.startsWith('notification-storage') ||
        key.startsWith('security-storage') ||
        key.includes('delilog') ||
        key.includes('tenko')
      );

      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }

      // Zustandストアのリセット
      useOfflineStore.getState().reset?.();
      useNotificationStore.getState().clearError?.();
      useSecurityStore.getState().clearError?.();

      console.log('🗑️ ローカルデータ削除完了:', appKeys.length, 'キー');
    } catch (error) {
      console.error('❌ ローカルデータ削除エラー:', error);
      throw error;
    }
  }

  /**
   * サーバーデータの削除
   */
  private async deleteServerData(userId: string): Promise<void> {
    try {
      // 外部キー制約を考慮した削除順序
      
      // 1. 点呼記録
      await this.deleteTenkoRecords(userId);
      
      // 2. 運行なし日
      await this.deleteNoOperationDays(userId);
      
      // 3. 車両データ
      await this.deleteVehicleData(userId);
      
      // 4. ユーザープロフィール
      await this.deleteUserData(userId);

      console.log('🗑️ サーバーデータ削除完了');
    } catch (error) {
      console.error('❌ サーバーデータ削除エラー:', error);
      throw error;
    }
  }

  /**
   * 点呼記録の削除
   */
  private async deleteTenkoRecords(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tenko_records')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ 点呼記録削除エラー:', error);
      throw new Error('点呼記録の削除に失敗しました');
    }
    
    console.log('🗑️ 点呼記録削除完了');
  }

  /**
   * 運行なし日の削除
   */
  private async deleteNoOperationDays(userId: string): Promise<void> {
    const { error } = await supabase
      .from('no_operation_days')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ 運行なし日削除エラー:', error);
      throw new Error('運行なし日の削除に失敗しました');
    }
    
    console.log('🗑️ 運行なし日削除完了');
  }

  /**
   * 車両データの削除
   */
  private async deleteVehicleData(userId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ 車両データ削除エラー:', error);
      throw new Error('車両データの削除に失敗しました');
    }
    
    console.log('🗑️ 車両データ削除完了');
  }

  /**
   * ユーザーデータの削除
   */
  private async deleteUserData(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users_profile')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ ユーザーデータ削除エラー:', error);
      throw new Error('ユーザーデータの削除に失敗しました');
    }
    
    console.log('🗑️ ユーザーデータ削除完了');
  }

  /**
   * 認証情報の削除
   */
  private async deleteAuthData(): Promise<void> {
    try {
      // Supabaseからサインアウト
      await supabase.auth.signOut();
      
      // 認証ストアをクリア
      useAuthStore.getState().signOut?.();
      
      console.log('🗑️ 認証データ削除完了');
    } catch (error) {
      console.error('❌ 認証データ削除エラー:', error);
      throw error;
    }
  }

  /**
   * セキュリティデータの削除
   */
  private async deleteSecurityData(): Promise<void> {
    try {
      await securityService.clearAllSecureData();
      console.log('🗑️ セキュリティデータ削除完了');
    } catch (error) {
      console.error('❌ セキュリティデータ削除エラー:', error);
      throw error;
    }
  }

  /**
   * 通知データの削除
   */
  private async deleteNotificationData(): Promise<void> {
    try {
      await notificationService.cancelAllNotifications();
      console.log('🗑️ 通知データ削除完了');
    } catch (error) {
      console.error('❌ 通知データ削除エラー:', error);
      // 通知削除エラーは致命的ではないため、ログのみ
    }
  }

  /**
   * データ削除の確認
   */
  async verifyDataDeletion(userId: string): Promise<{
    tenkoRecords: number;
    vehicles: number;
    userProfile: boolean;
    localData: number;
  }> {
    try {
      // サーバーデータの確認
      const [tenkoResult, vehicleResult, profileResult] = await Promise.all([
        supabase.from('tenko_records').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('vehicles').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('users_profile').select('id').eq('id', userId).single(),
      ]);

      // ローカルデータの確認
      const localKeys = await AsyncStorage.getAllKeys();
      const appLocalKeys = localKeys.filter(key => 
        key.startsWith('auth-storage') ||
        key.startsWith('offline-storage') ||
        key.startsWith('notification-storage') ||
        key.startsWith('security-storage')
      );

      return {
        tenkoRecords: tenkoResult.count || 0,
        vehicles: vehicleResult.count || 0,
        userProfile: !profileResult.error,
        localData: appLocalKeys.length,
      };
    } catch (error) {
      console.error('❌ データ削除確認エラー:', error);
      throw error;
    }
  }

  /**
   * データ移行の準備
   */
  async prepareDataMigration(userId: string): Promise<{
    exportPath: string;
    dataSize: number;
    itemCount: number;
  }> {
    try {
      console.log('📦 データ移行準備開始');
      
      // 全データをエクスポート
      const { dataExportService } = await import('./dataExportService');
      
      // 過去1年間のデータをエクスポート
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const result = await dataExportService.exportData({
        format: 'csv',
        dateRange: {
          startDate: startDateStr,
          endDate,
        },
        includeVehicleInfo: true,
        includePersonalInfo: true,
      });
      
      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'データエクスポートに失敗しました');
      }
      
      // データサイズ取得
      const fileInfo = await import('expo-file-system').then(fs => 
        fs.FileSystem.getInfoAsync(result.filePath!)
      );
      
      return {
        exportPath: result.filePath,
        dataSize: fileInfo.exists ? fileInfo.size || 0 : 0,
        itemCount: 0, // 実装時にレコード数を計算
      };
    } catch (error) {
      console.error('❌ データ移行準備エラー:', error);
      throw error;
    }
  }

  /**
   * データ復旧機能
   */
  async restoreFromBackup(backupFilePath: string): Promise<void> {
    // 将来の実装予定
    throw new Error('データ復旧機能は現在開発中です');
  }
}

// シングルトンインスタンス
export const dataManagementService = new DataManagementService();