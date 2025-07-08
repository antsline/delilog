/**
 * 機能制限管理ユーティリティ
 * 無料版・プレミアム版の機能制限を管理
 */

import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Logger } from '@/utils/logger';

// 無料版の制限値
export const FREE_LIMITS = {
  maxRecords: 50, // 最大記録数
  maxVehicles: 3, // 最大車両数
  maxExportPerMonth: 5, // 月間エクスポート回数
  maxCloudSync: 0, // クラウド同期無効
  maxBackups: 1, // バックアップ保持数
  reportHistoryDays: 30, // レポート履歴日数
} as const;

// プレミアム版の制限値
export const PREMIUM_LIMITS = {
  maxRecords: -1, // 無制限
  maxVehicles: -1, // 無制限
  maxExportPerMonth: -1, // 無制限
  maxCloudSync: 1, // クラウド同期有効
  maxBackups: -1, // 無制限
  reportHistoryDays: -1, // 無制限
} as const;

export type FeatureLimitType = keyof typeof FREE_LIMITS;

interface FeatureLimitCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  message?: string;
}

class FeatureLimitsManager {
  /**
   * 指定した機能の制限をチェック
   */
  async checkFeatureLimit(
    feature: FeatureLimitType,
    currentUsage: number = 0
  ): Promise<FeatureLimitCheck> {
    try {
      const subscriptionStore = useSubscriptionStore.getState();
      const isPremium = subscriptionStore.isBasic;
      
      const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
      const limit = limits[feature];
      
      // 無制限の場合
      if (limit === -1) {
        return {
          allowed: true,
          currentUsage,
          limit,
          remaining: -1,
          isUnlimited: true,
        };
      }

      // 制限チェック
      const allowed = currentUsage < limit;
      const remaining = Math.max(0, limit - currentUsage);

      const result: FeatureLimitCheck = {
        allowed,
        currentUsage,
        limit,
        remaining,
        isUnlimited: false,
      };

      // エラーメッセージの生成
      if (!allowed) {
        result.message = this.getFeatureLimitMessage(feature, limit);
      }

      Logger.debug('Feature limit check', {
        feature,
        isPremium,
        currentUsage,
        limit,
        allowed,
      });

      return result;
    } catch (error) {
      Logger.error('Feature limit check failed', error);
      
      // エラー時は制限なしとして扱う（安全側に倒す）
      return {
        allowed: true,
        currentUsage,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
        message: '制限チェックに失敗しました',
      };
    }
  }

  /**
   * 点呼記録数の制限をチェック
   */
  async checkRecordLimit(currentRecordCount: number): Promise<FeatureLimitCheck> {
    return this.checkFeatureLimit('maxRecords', currentRecordCount);
  }

  /**
   * 車両数の制限をチェック
   */
  async checkVehicleLimit(currentVehicleCount: number): Promise<FeatureLimitCheck> {
    return this.checkFeatureLimit('maxVehicles', currentVehicleCount);
  }

  /**
   * エクスポート機能の制限をチェック
   */
  async checkExportLimit(currentExportCount: number): Promise<FeatureLimitCheck> {
    return this.checkFeatureLimit('maxExportPerMonth', currentExportCount);
  }

  /**
   * クラウド同期機能の利用可否をチェック
   */
  async checkCloudSyncAvailability(): Promise<FeatureLimitCheck> {
    return this.checkFeatureLimit('maxCloudSync', 0);
  }

  /**
   * バックアップ機能の制限をチェック
   */
  async checkBackupLimit(currentBackupCount: number): Promise<FeatureLimitCheck> {
    return this.checkFeatureLimit('maxBackups', currentBackupCount);
  }

  /**
   * レポート履歴の制限をチェック
   */
  async checkReportHistoryLimit(requestedDays: number): Promise<FeatureLimitCheck> {
    const subscriptionStore = useSubscriptionStore.getState();
    const isPremium = subscriptionStore.isBasic;
    
    const maxDays = isPremium ? PREMIUM_LIMITS.reportHistoryDays : FREE_LIMITS.reportHistoryDays;
    
    if (maxDays === -1) {
      return {
        allowed: true,
        currentUsage: requestedDays,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
      };
    }

    return {
      allowed: requestedDays <= maxDays,
      currentUsage: requestedDays,
      limit: maxDays,
      remaining: Math.max(0, maxDays - requestedDays),
      isUnlimited: false,
      message: requestedDays > maxDays ? 
        `レポート履歴は${maxDays}日間まで表示可能です。プレミアムプランで無制限になります。` : 
        undefined,
    };
  }

  /**
   * プレミアム機能へのアップグレード促進
   */
  shouldShowUpgradePrompt(feature: FeatureLimitType): boolean {
    const subscriptionStore = useSubscriptionStore.getState();
    return !subscriptionStore.isBasic;
  }

  /**
   * アップグレード促進メッセージを取得
   */
  getUpgradePromptMessage(feature: FeatureLimitType): string {
    const messages = {
      maxRecords: 'プレミアムプランで無制限の点呼記録をご利用いただけます。',
      maxVehicles: 'プレミアムプランで車両登録数が無制限になります。',
      maxExportPerMonth: 'プレミアムプランで無制限のデータエクスポートが可能です。',
      maxCloudSync: 'プレミアムプランでクラウド同期機能がご利用いただけます。',
      maxBackups: 'プレミアムプランで無制限のバックアップ保存が可能です。',
      reportHistoryDays: 'プレミアムプランで全期間のレポートが閲覧可能です。',
    };

    return messages[feature] || 'プレミアムプランで全機能をお楽しみください。';
  }

  /**
   * 機能制限に達した際のメッセージを取得
   */
  private getFeatureLimitMessage(feature: FeatureLimitType, limit: number): string {
    const messages = {
      maxRecords: `点呼記録は${limit}件まで保存できます。`,
      maxVehicles: `車両は${limit}台まで登録できます。`,
      maxExportPerMonth: `データエクスポートは月${limit}回まで利用できます。`,
      maxCloudSync: 'クラウド同期機能はプレミアムプランでご利用いただけます。',
      maxBackups: `バックアップは${limit}件まで保存できます。`,
      reportHistoryDays: `レポートは過去${limit}日間まで表示できます。`,
    };

    return messages[feature] || '制限に達しました。';
  }

  /**
   * 使用量統計を取得
   */
  async getUsageStatistics(): Promise<{
    records: FeatureLimitCheck;
    vehicles: FeatureLimitCheck;
    exports: FeatureLimitCheck;
    cloudSync: FeatureLimitCheck;
    backups: FeatureLimitCheck;
  }> {
    // 実際の使用量は各サービスから取得する必要がある
    // ここでは仮の値を返す
    const [records, vehicles, exports, cloudSync, backups] = await Promise.all([
      this.checkRecordLimit(0), // 実際は点呼記録サービスから取得
      this.checkVehicleLimit(0), // 実際は車両サービスから取得
      this.checkExportLimit(0), // 実際はエクスポートサービスから取得
      this.checkCloudSyncAvailability(),
      this.checkBackupLimit(0), // 実際はバックアップサービスから取得
    ]);

    return {
      records,
      vehicles,
      exports,
      cloudSync,
      backups,
    };
  }
}

// シングルトンインスタンス
export const featureLimitsManager = new FeatureLimitsManager();

// React Hook用のヘルパー
export const useFeatureLimit = (feature: FeatureLimitType, currentUsage: number = 0) => {
  const [limitCheck, setLimitCheck] = React.useState<FeatureLimitCheck | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkLimit = async () => {
      try {
        setIsLoading(true);
        const result = await featureLimitsManager.checkFeatureLimit(feature, currentUsage);
        setLimitCheck(result);
      } catch (error) {
        Logger.error('Feature limit hook error', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLimit();
  }, [feature, currentUsage]);

  return { limitCheck, isLoading };
};

import React from 'react';