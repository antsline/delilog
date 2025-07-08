/**
 * サブスクリプション状態管理Store
 * 決済状態とプレミアム機能の管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, SubscriptionStatus, PricingPlan } from '@/services/subscriptionService';
import { Logger } from '@/utils/logger';

export interface BasicFeatures {
  unlimitedRecords: boolean;
  pdfExport: boolean;
  vehicleRegistration: boolean;
  dataRetention: boolean;
  operationRecords: boolean;
  reminderFunction: boolean;
}

export interface SubscriptionState {
  // サブスクリプション状態
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // ベーシック機能
  isBasic: boolean;
  basicFeatures: BasicFeatures;
  
  // 料金プラン
  pricingPlans: PricingPlan[];
  
  // トライアル情報
  trialDaysRemaining: number | null;
  
  // 最終チェック時刻
  lastChecked: string | null;
}

export interface SubscriptionActions {
  // 初期化
  initializeSubscription: (userId?: string) => Promise<void>;
  
  // サブスクリプション状態の取得・更新
  checkSubscriptionStatus: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  
  // 購入関連
  loadPricingPlans: () => Promise<void>;
  purchaseSubscription: (planId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  
  // ベーシック機能チェック
  checkBasicFeature: (feature: keyof BasicFeatures) => boolean;
  
  // エラー処理
  clearError: () => void;
  setError: (error: string) => void;
  
  // リセット
  resetSubscriptionState: () => void;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

// ヘルパー関数: ベーシック機能の状態を取得
const getBasicFeatures = (isBasic: boolean): BasicFeatures => {
  return {
    unlimitedRecords: isBasic,
    pdfExport: isBasic,
    vehicleRegistration: isBasic,
    dataRetention: isBasic,
    operationRecords: isBasic,
    reminderFunction: isBasic,
  };
};

const initialState: SubscriptionState = {
  subscriptionStatus: null,
  isLoading: false,
  error: null,
  isBasic: false,
  basicFeatures: {
    unlimitedRecords: false,
    pdfExport: false,
    vehicleRegistration: false,
    dataRetention: false,
    operationRecords: false,
    reminderFunction: false,
  },
  pricingPlans: [],
  trialDaysRemaining: null,
  lastChecked: null,
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 初期化
      initializeSubscription: async (userId?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await subscriptionService.initialize(userId);
          
          // 初期化後に状態をチェック
          await get().checkSubscriptionStatus();
          await get().loadPricingPlans();
          
          Logger.success('Subscription store initialized');
        } catch (error: any) {
          Logger.error('Failed to initialize subscription', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // サブスクリプション状態のチェック
      checkSubscriptionStatus: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const status = await subscriptionService.getSubscriptionStatus();
          const trialDays = await subscriptionService.getTrialDaysRemaining();
          
          const isBasic = status.isActive;
          const basicFeatures = getBasicFeatures(isBasic);
          
          set({
            subscriptionStatus: status,
            isBasic,
            basicFeatures,
            trialDaysRemaining: trialDays,
            lastChecked: new Date().toISOString(),
            isLoading: false,
          });

          Logger.success('Subscription status checked', { isBasic, trialDays });
        } catch (error: any) {
          Logger.error('Failed to check subscription status', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // サブスクリプション状態の強制更新
      refreshSubscriptionStatus: async () => {
        Logger.info('Refreshing subscription status');
        await get().checkSubscriptionStatus();
      },

      // 料金プランの読み込み
      loadPricingPlans: async () => {
        try {
          const plans = await subscriptionService.getPricingPlans();
          set({ pricingPlans: plans });
          Logger.success('Pricing plans loaded', plans.length);
        } catch (error: any) {
          Logger.error('Failed to load pricing plans', error);
          set({ error: error.message });
        }
      },

      // サブスクリプション購入
      purchaseSubscription: async (planId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const packages = await subscriptionService.getAvailablePackages();
          const targetPackage = packages.find(pkg => pkg.identifier === planId);
          
          if (!targetPackage) {
            throw new Error('指定されたプランが見つかりません');
          }

          const result = await subscriptionService.purchasePackage(targetPackage);
          
          if (result.success) {
            // 購入成功後に状態を更新
            await get().checkSubscriptionStatus();
            Logger.success('Subscription purchased successfully');
            return true;
          } else {
            throw new Error('購入処理が完了しませんでした');
          }
        } catch (error: any) {
          Logger.error('Purchase failed', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // 購入履歴の復元
      restorePurchases: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await subscriptionService.restorePurchases();
          
          if (result.success) {
            await get().checkSubscriptionStatus();
            Logger.success('Purchases restored successfully');
            return true;
          } else {
            set({ isLoading: false });
            Logger.info('No purchases found to restore');
            return false;
          }
        } catch (error: any) {
          Logger.error('Restore failed', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // ベーシック機能のチェック
      checkBasicFeature: (feature: keyof BasicFeatures) => {
        const { basicFeatures } = get();
        return basicFeatures[feature];
      },

      // エラークリア
      clearError: () => {
        set({ error: null });
      },

      // エラー設定
      setError: (error: string) => {
        set({ error });
      },

      // 状態リセット
      resetSubscriptionState: () => {
        set(initialState);
        Logger.info('Subscription state reset');
      },

    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
        isBasic: state.isBasic,
        basicFeatures: state.basicFeatures,
        trialDaysRemaining: state.trialDaysRemaining,
        lastChecked: state.lastChecked,
      }),
    }
  )
);

// ベーシック機能チェック用のカスタムフック
export const useBasicFeature = (feature: keyof BasicFeatures) => {
  return useSubscriptionStore((state) => state.checkBasicFeature(feature));
};

// サブスクリプション状態チェック用のカスタムフック
export const useSubscriptionStatus = () => {
  const isBasic = useSubscriptionStore((state) => state.isBasic);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const subscriptionStatus = useSubscriptionStore((state) => state.subscriptionStatus);
  const trialDaysRemaining = useSubscriptionStore((state) => state.trialDaysRemaining);
  const error = useSubscriptionStore((state) => state.error);
  
  return {
    isBasic,
    isLoading,
    subscriptionStatus,
    trialDaysRemaining,
    error,
  };
};