/**
 * 機能制限管理ユーティリティ
 * 無料版・プレミアム版の機能制限を管理
 */

import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Logger } from '@/utils/logger';

// 無料版の制限値（マネタイズ戦略に基づく）
export const FREE_LIMITS = {
  // データ保存・表示
  dataViewPeriodDays: 90, // 3ヶ月間のみ表示
  dataRetentionDays: 365, // サーバー上は1年保存
  
  // 入力効率
  autoFillPreviousValues: false, // 前回値の自動入力なし
  templateSave: 0, // テンプレート保存不可
  voiceInput: false, // 音声入力不可
  copyFunction: false, // コピー機能不可
  
  // データ出力
  pdfBulkExport: false, // PDF一括出力不可
  csvExport: false, // CSV出力不可
  editBeforeOutput: false, // 出力前の編集不可
  
  // データ管理
  recordEditDays: 0, // 当日のみ修正可能（翌日以降は不可）
  searchFunction: false, // 検索機能なし（スクロールのみ）
  bulkOperations: false, // 一括操作不可
  
  // リマインダー
  basicReminder: 2, // 1日2回のみ
  missedRecordAlert: false, // 未記録アラートなし
  maintenanceReminder: false, // 定期点検リマインダーなし
  
  // 拡張機能
  dailyInspection: false, // 日常点検記録なし
  operationRecords: false, // 運行記録なし
  maintenanceRecords: false, // 整備記録なし
  
  // 同期・共有
  cloudSync: false, // クラウド同期なし
  multiDevice: 0, // 複数端末利用不可
  dataSharing: false, // データ共有不可
  
  // その他
  maxVehicles: -1, // 車両登録は無制限
  maxRecords: -1, // 点呼記録作成は無制限
  backupFrequency: 'manual_monthly', // 手動バックアップ（月1回推奨）
} as const;

// ベーシック版の制限値（マネタイズ戦略に基づく）
export const BASIC_LIMITS = {
  // データ保存・表示
  dataViewPeriodDays: 365, // 1年間表示可能
  dataRetentionDays: 365, // 1年間保存
  
  // 入力効率
  autoFillPreviousValues: true, // 前回値の自動入力
  templateSave: 5, // テンプレート5個まで
  voiceInput: true, // 音声入力可能
  copyFunction: 'previous_day', // 前日コピー可能
  
  // データ出力
  pdfBulkExport: true, // 週/月単位の一括出力
  csvExport: true, // CSV出力可能
  editBeforeOutput: true, // 出力前の編集可能
  
  // データ管理
  recordEditDays: 7, // 7日間修正可能
  searchFunction: 'date_vehicle', // 日付・車両検索
  bulkOperations: 'multi_select', // 複数選択操作
  
  // リマインダー
  basicReminder: -1, // 自由設定
  missedRecordAlert: true, // 未記録アラートあり
  maintenanceReminder: true, // 定期点検リマインダーあり
  
  // 拡張機能
  dailyInspection: true, // 日常点検記録
  operationRecords: true, // 運行記録
  maintenanceRecords: true, // 整備記録
  
  // 同期・共有
  cloudSync: true, // クラウド同期
  multiDevice: 2, // 2台まで利用可能
  dataSharing: false, // データ共有不可
  
  // その他
  maxVehicles: -1, // 車両登録無制限
  maxRecords: -1, // 点呼記録無制限
  backupFrequency: 'auto_daily', // 自動バックアップ（毎日）
} as const;

// プロ版の制限値（将来実装予定）
export const PRO_LIMITS = {
  // データ保存・表示
  dataViewPeriodDays: -1, // 無制限表示
  dataRetentionDays: 1095, // 3年間保存
  
  // 入力効率
  autoFillPreviousValues: true,
  templateSave: -1, // 無制限
  voiceInput: true,
  copyFunction: 'any_day', // 任意日コピー
  
  // データ出力
  pdfBulkExport: true, // 任意期間の一括出力
  csvExport: true,
  editBeforeOutput: 'bulk_edit', // 一括編集可能
  
  // データ管理
  recordEditDays: -1, // いつでも修正可能
  searchFunction: 'detailed', // 詳細検索
  bulkOperations: 'pattern_setting', // パターン設定
  
  // リマインダー
  basicReminder: -1, // スマート通知
  missedRecordAlert: true,
  maintenanceReminder: true,
  
  // 拡張機能
  dailyInspection: 'with_photos', // 写真付き日常点検
  operationRecords: 'auto_calc', // 自動計算
  maintenanceRecords: true,
  
  // 同期・共有
  cloudSync: true,
  multiDevice: -1, // 無制限
  dataSharing: true, // データ共有可能
  
  // 経営支援
  salesExpenseManagement: true, // 売上・経費管理
  detailedAnalysis: true, // 詳細分析
  pcApp: true, // PC版アプリ
  
  // その他
  maxVehicles: -1,
  maxRecords: -1,
  backupFrequency: 'realtime', // リアルタイムバックアップ
} as const;

export type FeatureLimitType = keyof typeof FREE_LIMITS;
export type SubscriptionPlan = 'free' | 'basic' | 'pro';

// プラン判定の統合
export const getPlanLimits = (plan: SubscriptionPlan) => {
  switch (plan) {
    case 'free':
      return FREE_LIMITS;
    case 'basic':
      return BASIC_LIMITS;
    case 'pro':
      return PRO_LIMITS;
    default:
      return FREE_LIMITS;
  }
};

interface FeatureLimitCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number | string | boolean;
  remaining: number;
  isUnlimited: boolean;
  planRequired?: SubscriptionPlan;
  upgradeMessage?: string;
  message?: string;
}

// 特定機能のアクセスチェック結果
interface FeatureAccessResult {
  canAccess: boolean;
  currentPlan: SubscriptionPlan;
  requiredPlan?: SubscriptionPlan;
  reason?: string;
  upgradePrompt?: string;
  daysRestricted?: number; // データ表示制限日数
}

class FeatureLimitsManager {
  /**
   * 現在のサブスクリプションプランを取得
   */
  private getCurrentPlan(): SubscriptionPlan {
    const subscriptionStore = useSubscriptionStore.getState();
    if (subscriptionStore.isBasic) {
      return 'basic';
    }
    return 'free';
  }

  /**
   * 指定した機能にアクセスできるかチェック
   */
  async checkFeatureAccess(feature: FeatureLimitType): Promise<FeatureAccessResult> {
    try {
      const currentPlan = this.getCurrentPlan();
      const limits = getPlanLimits(currentPlan);
      const featureValue = limits[feature];
      
      // ブール型の機能（有効/無効）
      if (typeof featureValue === 'boolean') {
        if (featureValue) {
          return { canAccess: true, currentPlan };
        } else {
          const requiredPlan = this.getMinimumRequiredPlan(feature);
          return {
            canAccess: false,
            currentPlan,
            requiredPlan,
            reason: `${this.getFeatureName(feature)}は${this.getPlanName(requiredPlan)}でご利用いただけます`,
            upgradePrompt: this.getUpgradePrompt(feature, requiredPlan),
          };
        }
      }
      
      // 数値型の機能（制限数）
      if (typeof featureValue === 'number') {
        if (featureValue === -1) {
          return { canAccess: true, currentPlan }; // 無制限
        } else if (featureValue === 0) {
          const requiredPlan = this.getMinimumRequiredPlan(feature);
          return {
            canAccess: false,
            currentPlan,
            requiredPlan,
            reason: `${this.getFeatureName(feature)}は${this.getPlanName(requiredPlan)}でご利用いただけます`,
            upgradePrompt: this.getUpgradePrompt(feature, requiredPlan),
          };
        }
      }
      
      // 文字列型の機能（種類指定）
      if (typeof featureValue === 'string') {
        return { canAccess: true, currentPlan };
      }
      
      return { canAccess: true, currentPlan };
    } catch (error) {
      Logger.error('Feature access check failed', error);
      return { canAccess: true, currentPlan: this.getCurrentPlan() }; // エラー時はアクセス許可
    }
  }

  /**
   * データ表示期限をチェック
   */
  async checkDataViewAccess(requestedDate: Date): Promise<FeatureAccessResult> {
    const currentPlan = this.getCurrentPlan();
    const limits = getPlanLimits(currentPlan);
    const viewPeriodDays = limits.dataViewPeriodDays;
    
    if (viewPeriodDays === -1) {
      return { canAccess: true, currentPlan }; // 無制限
    }
    
    const now = getJapanDate();
    const daysDiff = getDaysDifference(now, requestedDate);
    
    if (daysDiff <= viewPeriodDays) {
      return { canAccess: true, currentPlan };
    } else {
      return {
        canAccess: false,
        currentPlan,
        requiredPlan: 'basic',
        daysRestricted: daysDiff - viewPeriodDays,
        reason: `${viewPeriodDays}日以前のデータはベーシックプランで表示できます`,
        upgradePrompt: '過去のデータをすべて確認するにはベーシックプランにアップグレードしてください',
      };
    }
  }

  /**
   * 記録修正可能かチェック
   */
  async checkRecordEditAccess(recordDate: Date): Promise<FeatureAccessResult> {
    const currentPlan = this.getCurrentPlan();
    const limits = getPlanLimits(currentPlan);
    const editDays = limits.recordEditDays;
    
    if (editDays === -1) {
      return { canAccess: true, currentPlan }; // 無制限
    }
    
    const now = getJapanDate();
    const daysDiff = getDaysDifference(now, recordDate);
    
    if (daysDiff <= editDays) {
      return { canAccess: true, currentPlan };
    } else {
      const requiredPlan = editDays === 0 ? 'basic' : 'pro';
      return {
        canAccess: false,
        currentPlan,
        requiredPlan,
        reason: `記録の修正は${editDays === 0 ? '当日のみ' : `${editDays}日間のみ`}可能です`,
        upgradePrompt: `${this.getPlanName(requiredPlan)}なら${
          requiredPlan === 'basic' ? '7日間' : 'いつでも'
        }修正できます`,
      };
    }
  }

  /**
   * 最低必要プランを取得
   */
  private getMinimumRequiredPlan(feature: FeatureLimitType): SubscriptionPlan {
    // ベーシックで利用可能な機能
    const basicFeatures: FeatureLimitType[] = [
      'autoFillPreviousValues', 'templateSave', 'voiceInput', 'copyFunction',
      'pdfBulkExport', 'csvExport', 'editBeforeOutput', 'searchFunction',
      'bulkOperations', 'missedRecordAlert', 'maintenanceReminder',
      'dailyInspection', 'operationRecords', 'maintenanceRecords', 'cloudSync'
    ];
    
    if (basicFeatures.includes(feature)) {
      return 'basic';
    }
    
    // その他はプロで必要
    return 'pro';
  }
  
  /**
   * 機能名を取得
   */
  private getFeatureName(feature: FeatureLimitType): string {
    const featureNames: Record<FeatureLimitType, string> = {
      dataViewPeriodDays: 'データ表示期限',
      dataRetentionDays: 'データ保存期間',
      autoFillPreviousValues: '前回値自動入力',
      templateSave: 'テンプレート保存',
      voiceInput: '音声入力',
      copyFunction: 'コピー機能',
      pdfBulkExport: 'PDF一括出力',
      csvExport: 'CSV出力',
      editBeforeOutput: '出力前編集',
      recordEditDays: '記録修正期限',
      searchFunction: '検索機能',
      bulkOperations: '一括操作',
      basicReminder: 'リマインダー',
      missedRecordAlert: '未記録アラート',
      maintenanceReminder: '定期点検リマインダー',
      dailyInspection: '日常点検記録',
      operationRecords: '運行記録',
      maintenanceRecords: '整備記録',
      cloudSync: 'クラウド同期',
      multiDevice: '複数端末利用',
      dataSharing: 'データ共有',
      maxVehicles: '車両登録数',
      maxRecords: '記録作成数',
      backupFrequency: 'バックアップ頻度',
    };
    
    return featureNames[feature] || feature;
  }
  
  /**
   * プラン名を取得
   */
  private getPlanName(plan: SubscriptionPlan): string {
    const planNames: Record<SubscriptionPlan, string> = {
      free: '無料プラン',
      basic: 'ベーシックプラン',
      pro: 'プロプラン',
    };
    
    return planNames[plan];
  }
  
  /**
   * アップグレード促進メッセージを取得
   */
  private getUpgradePrompt(feature: FeatureLimitType, requiredPlan: SubscriptionPlan): string {
    const basicPrompts: Record<string, string> = {
      autoFillPreviousValues: '毎日の入力が10秒で完了！',
      pdfBulkExport: '30回の作業が1回で完了します',
      searchFunction: '過去の記録を簡単に検索できます',
      recordEditDays: '安心の7日間修正可能',
      voiceInput: '声で入力できてさらに簡単に',
    };
    
    const specificPrompt = basicPrompts[feature];
    if (specificPrompt) {
      return `${this.getPlanName(requiredPlan)}なら${specificPrompt}`;
    }
    
    return `${this.getPlanName(requiredPlan)}で${this.getFeatureName(feature)}がご利用いただけます`;
  }

  /**
   * 特定のシナリオでアップグレード誘導を表示するか判定
   */
  shouldShowUpgradePrompt(context: {
    feature: FeatureLimitType;
    usageCount?: number;
    lastShownDays?: number;
  }): boolean {
    const currentPlan = this.getCurrentPlan();
    
    // ベーシック以上は表示しない
    if (currentPlan !== 'free') {
      return false;
    }
    
    // 使用回数ベースの表示判定
    if (context.usageCount !== undefined) {
      const showThresholds: Record<string, number> = {
        autoFillPreviousValues: 10, // 10回手入力後
        pdfBulkExport: 5, // 5回PDF作成後
        searchFunction: 3, // スクロールで3回後
        recordEditDays: 1, // 修正できないことを1回体験後
      };
      
      const threshold = showThresholds[context.feature] || 5;
      return context.usageCount >= threshold;
    }
    
    return true;
  }
  
  /**
   * コンテキストに応じたアップグレードメッセージを取得
   */
  getContextualUpgradeMessage(context: {
    feature: FeatureLimitType;
    scenario: 'input_completion' | 'pdf_export' | 'data_search' | 'edit_attempt' | 'trial_day';
    day?: number;
  }): string {
    const { feature, scenario } = context;
    
    const messages: Record<string, Record<string, string>> = {
      input_completion: {
        autoFillPreviousValues: '💡 ベーシックプランなら前回値が自動入力されます。\n毎日の入力が10秒で完了！',
      },
      pdf_export: {
        pdfBulkExport: 'まとめて出力できたら...\nベーシックプランなら月単位で一括出力。\n30回の作業が1回で完了します。',
      },
      data_search: {
        searchFunction: '過去の記録を探すのに苦労していませんか？\nベーシックプランならアプリ内で簡単検索！',
      },
      edit_attempt: {
        recordEditDays: '修正できなくてお困りですか？\nベーシックプランなら7日間修正可能で安心です',
      },
      trial_day: {
        default: `無料トライアル${
          context.day ? `残り${context.day}日` : ''
        }\n前回値の自動入力、便利ですね！`,
      },
    };
    
    return messages[scenario]?.[feature] || messages[scenario]?.default || 'ベーシックプランでさらに便利に！';
  }

  /**
   * 特定シナリオでのアップグレード促進情報を取得
   */
  getUpgradeIncentive(scenario: {
    type: 'manual_input_stress' | 'pdf_individual_pain' | 'data_view_limit' | 'edit_deadline' | 'search_frustration';
    count?: number;
    date?: Date;
  }): {
    shouldShow: boolean;
    title: string;
    message: string;
    ctaText: string;
    value: string;
    timesSaved?: string;
  } | null {
    const currentPlan = this.getCurrentPlan();
    if (currentPlan !== 'free') return null;
    
    switch (scenario.type) {
      case 'manual_input_stress':
        if ((scenario.count || 0) >= 10) {
          return {
            shouldShow: true,
            title: '💡 もっと簡単に入力できたら...',
            message: 'ベーシックプランなら前回値が自動入力されます。',
            ctaText: '14日間無料で試す',
            value: '月900円の価値',
            timesSaved: '月3時間 → 30分（時給換算2,500円以上！）',
          };
        }
        break;
        
      case 'pdf_individual_pain':
        if ((scenario.count || 0) >= 5) {
          return {
            shouldShow: true,
            title: '📄 まとめて出力できたら...',
            message: 'ベーシックプランなら月単位で一括出力。\n30回の作業が1回で完了します。',
            ctaText: '一括出力を試す',
            value: '時間を大幅短縮',
          };
        }
        break;
        
      case 'data_view_limit':
        if (scenario.date) {
          const daysDiff = Math.floor((new Date().getTime() - scenario.date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 90) {
            return {
              shouldShow: true,
              title: '📅 過去のデータを確認したいですか？',
              message: '3ヶ月以前のデータはベーシックプランで表示できます。\nデータは決して消えません。',
              ctaText: '過去データを見る',
              value: '1年間の履歴表示',
            };
          }
        }
        break;
        
      case 'edit_deadline':
        return {
          shouldShow: true,
          title: '⚠️ 修正できなくてお困りですか？',
          message: 'ベーシックプランなら7日間修正可能で安心です。',
          ctaText: '修正機能を試す',
          value: '安心の修正期限',
        };
        
      default:
        return null;
    }
    
    return null;
  }
}

// シングルトンインスタンス
export const featureLimitsManager = new FeatureLimitsManager();

// React Hook用のヘルパー
export const useFeatureAccess = (feature: FeatureLimitType) => {
  const [accessResult, setAccessResult] = React.useState<FeatureAccessResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const result = await featureLimitsManager.checkFeatureAccess(feature);
        setAccessResult(result);
      } catch (error) {
        Logger.error('Feature access hook error', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { 
    canAccess: accessResult?.canAccess || false,
    accessResult, 
    isLoading,
    currentPlan: accessResult?.currentPlan || 'free',
    requiredPlan: accessResult?.requiredPlan,
    upgradePrompt: accessResult?.upgradePrompt,
  };
};

// データ表示制限用フック
export const useDataViewAccess = (targetDate: Date) => {
  const [accessResult, setAccessResult] = React.useState<FeatureAccessResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const result = await featureLimitsManager.checkDataViewAccess(targetDate);
        setAccessResult(result);
      } catch (error) {
        Logger.error('Data view access hook error', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [targetDate]);

  return { 
    canView: accessResult?.canAccess || false,
    accessResult, 
    isLoading,
    daysRestricted: accessResult?.daysRestricted,
  };
};

// 記録修正制限用フック
export const useRecordEditAccess = (recordDate: Date) => {
  const [accessResult, setAccessResult] = React.useState<FeatureAccessResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const result = await featureLimitsManager.checkRecordEditAccess(recordDate);
        setAccessResult(result);
      } catch (error) {
        Logger.error('Record edit access hook error', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [recordDate]);

  return { 
    canEdit: accessResult?.canAccess || false,
    accessResult, 
    isLoading,
  };
};

import React from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getDaysDifference, parseJapanDateString, getJapanDate } from '@/utils/dateUtils';