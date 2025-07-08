/**
 * サブスクリプション同期サービス
 * バックグラウンドでの状態同期と自動更新処理
 */

import { AppState, AppStateStatus } from 'react-native';
import { subscriptionService } from './subscriptionService';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Logger } from '@/utils/logger';

class SubscriptionSyncService {
  private appStateSubscription: any = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5分間隔
  private readonly BACKGROUND_SYNC_INTERVAL = 30 * 60 * 1000; // 30分間隔
  private isInitialized = false;

  /**
   * 同期サービスの初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      Logger.info('Subscription sync service already initialized');
      return;
    }

    try {
      // アプリ状態変更の監視を開始
      this.startAppStateMonitoring();
      
      // 定期同期の開始
      this.startPeriodicSync();
      
      // 初回同期の実行
      await this.performSync();
      
      this.isInitialized = true;
      Logger.success('Subscription sync service initialized');
    } catch (error) {
      Logger.error('Failed to initialize subscription sync service', error);
    }
  }

  /**
   * 同期サービスの停止
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isInitialized = false;
    Logger.info('Subscription sync service cleaned up');
  }

  /**
   * アプリ状態変更の監視を開始
   */
  private startAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * アプリ状態変更時の処理
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    Logger.info('App state changed', nextAppState);

    if (nextAppState === 'active') {
      // アプリがアクティブになった時に同期実行
      await this.performSync();
      
      // アクティブ時は短い間隔で同期
      this.startPeriodicSync(this.SYNC_INTERVAL);
    } else if (nextAppState === 'background') {
      // バックグラウンド時は長い間隔で同期
      this.startPeriodicSync(this.BACKGROUND_SYNC_INTERVAL);
    }
  }

  /**
   * 定期同期の開始
   */
  private startPeriodicSync(interval: number = this.SYNC_INTERVAL): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, interval);

    Logger.info('Periodic sync started', { interval });
  }

  /**
   * サブスクリプション状態の同期実行
   */
  async performSync(): Promise<void> {
    try {
      const store = useSubscriptionStore.getState();
      
      // 最後のチェックから十分時間が経過している場合のみ同期
      const lastChecked = store.lastChecked;
      if (lastChecked) {
        const timeSinceLastCheck = Date.now() - new Date(lastChecked).getTime();
        if (timeSinceLastCheck < 60 * 1000) { // 1分以内なら同期しない
          Logger.debug('Skipping sync - too recent');
          return;
        }
      }

      Logger.info('Performing subscription sync');
      
      // サブスクリプション状態の更新
      await store.checkSubscriptionStatus();
      
      // プレミアム状態の変更チェック
      await this.checkPremiumStatusChange();
      
      Logger.success('Subscription sync completed');
    } catch (error) {
      Logger.error('Subscription sync failed', error);
    }
  }

  /**
   * 手動同期の実行
   */
  async forcSync(): Promise<void> {
    Logger.info('Force syncing subscription status');
    await this.performSync();
  }

  /**
   * プレミアム状態変更の検出と処理
   */
  private async checkPremiumStatusChange(): Promise<void> {
    try {
      const store = useSubscriptionStore.getState();
      const currentStatus = store.subscriptionStatus;
      
      if (!currentStatus) {
        return;
      }

      // 期限切れの検出
      if (currentStatus.isActive && currentStatus.expirationDate) {
        const now = new Date();
        const expirationDate = new Date(currentStatus.expirationDate);
        
        if (now > expirationDate) {
          Logger.warn('Subscription expired, refreshing status');
          await store.refreshSubscriptionStatus();
          
          // 期限切れ通知
          this.notifySubscriptionExpired();
        }
      }

      // 更新失敗の検出
      if (currentStatus.isActive && !currentStatus.willRenew) {
        Logger.warn('Subscription will not renew');
        this.notifyRenewalIssue();
      }

    } catch (error) {
      Logger.error('Failed to check premium status change', error);
    }
  }

  /**
   * サブスクリプション期限切れ通知
   */
  private notifySubscriptionExpired(): void {
    // 通知サービスを使用して期限切れを通知
    Logger.production('Subscription expired notification');
    
    // 実際の通知実装はnotificationServiceを使用
    // notificationService.showLocalNotification({
    //   title: 'プレミアムプラン期限切れ',
    //   body: 'プレミアム機能が利用できなくなりました。',
    // });
  }

  /**
   * 更新失敗通知
   */
  private notifyRenewalIssue(): void {
    Logger.production('Subscription renewal issue notification');
    
    // 実際の通知実装はnotificationServiceを使用
    // notificationService.showLocalNotification({
    //   title: '自動更新に失敗しました',
    //   body: '決済情報を確認してください。',
    // });
  }

  /**
   * レシート検証の強制実行
   */
  async validateReceipt(): Promise<boolean> {
    try {
      Logger.info('Forcing receipt validation');
      
      // RevenueCatが自動的にレシート検証を行う
      const store = useSubscriptionStore.getState();
      await store.refreshSubscriptionStatus();
      
      const updatedStatus = store.subscriptionStatus;
      const isValid = updatedStatus?.isActive || false;
      
      Logger.success('Receipt validation completed', { isValid });
      return isValid;
    } catch (error) {
      Logger.error('Receipt validation failed', error);
      return false;
    }
  }

  /**
   * 購入復元の処理
   */
  async handlePurchaseRestore(): Promise<void> {
    try {
      Logger.info('Handling purchase restore');
      
      const store = useSubscriptionStore.getState();
      const success = await store.restorePurchases();
      
      if (success) {
        Logger.success('Purchase restored successfully');
        
        // 復元成功通知
        // notificationService.showLocalNotification({
        //   title: '購入履歴復元完了',
        //   body: 'プレミアム機能が復元されました。',
        // });
      } else {
        Logger.info('No purchases found to restore');
      }
    } catch (error) {
      Logger.error('Purchase restore failed', error);
    }
  }

  /**
   * エラー状態のリセット
   */
  async resetErrorState(): Promise<void> {
    try {
      const store = useSubscriptionStore.getState();
      store.clearError();
      
      // エラーリセット後に再同期
      await this.performSync();
      
      Logger.success('Subscription error state reset');
    } catch (error) {
      Logger.error('Failed to reset subscription error state', error);
    }
  }

  /**
   * デバッグ情報の取得
   */
  getDebugInfo(): {
    isInitialized: boolean;
    hasSyncInterval: boolean;
    hasAppStateSubscription: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      hasSyncInterval: this.syncInterval !== null,
      hasAppStateSubscription: this.appStateSubscription !== null,
    };
  }
}

// シングルトンインスタンス
export const subscriptionSyncService = new SubscriptionSyncService();