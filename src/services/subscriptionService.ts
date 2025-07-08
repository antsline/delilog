/**
 * サブスクリプション・決済サービス
 * RevenueCatを使用したアプリ内課金管理
 */

import Purchases, { 
  PurchasesPackage, 
  CustomerInfo, 
  PurchasesOffering,
  PURCHASE_TYPE 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Logger } from '@/utils/logger';

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  expirationDate: Date | null;
  originalPurchaseDate: Date | null;
  isTrial: boolean;
  willRenew: boolean;
}

export interface PricingPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  isPopular?: boolean;
  features: string[];
  trialDays?: number;
}

class SubscriptionService {
  private readonly API_KEY_IOS = Constants.expoConfig?.extra?.revenueCatIosApiKey || 
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_YOUR_IOS_API_KEY';
  private readonly API_KEY_ANDROID = Constants.expoConfig?.extra?.revenueCatAndroidApiKey || 
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_YOUR_ANDROID_API_KEY';
  private readonly ENTITLEMENT_ID = Constants.expoConfig?.extra?.revenueCatEntitlementId || 
    process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'delilog_basic';
  private readonly PRODUCT_ID = Constants.expoConfig?.extra?.revenueCatProductId || 
    process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ID || 'delilog_monthly_980';

  private isInitialized = false;

  /**
   * RevenueCatの初期化
   */
  async initialize(userId?: string): Promise<void> {
    try {
      if (this.isInitialized) {
        Logger.info('RevenueCat already initialized');
        return;
      }

      const apiKey = Platform.select({
        ios: this.API_KEY_IOS,
        android: this.API_KEY_ANDROID,
        default: this.API_KEY_IOS
      });

      // RevenueCat初期化
      // await Purchases.setLogLevel('DEBUG'); // 開発時のみ
      await Purchases.configure({ apiKey });

      // ユーザーIDを設定（ログイン済みの場合）
      if (userId) {
        await Purchases.logIn(userId);
        Logger.auth('RevenueCat user logged in', userId);
      }

      this.isInitialized = true;
      Logger.success('RevenueCat initialized successfully');
    } catch (error) {
      Logger.error('RevenueCat initialization failed', error);
      throw new Error('決済システムの初期化に失敗しました');
    }
  }

  /**
   * ユーザーのログイン（サブスクリプション状態の関連付け）
   */
  async loginUser(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const { customerInfo } = await Purchases.logIn(userId);
      Logger.auth('User logged in to RevenueCat', userId);
    } catch (error) {
      Logger.error('RevenueCat user login failed', error);
      throw new Error('ユーザー認証に失敗しました');
    }
  }

  /**
   * 現在のサブスクリプション状態を取得
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      await this.ensureInitialized();
      const customerInfo = await Purchases.getCustomerInfo();
      
      const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
      
      if (entitlement) {
        return {
          isActive: true,
          productId: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
          originalPurchaseDate: entitlement.originalPurchaseDate ? new Date(entitlement.originalPurchaseDate) : null,
          isTrial: false, // entitlement.isInIntroductoryPrice || false,
          willRenew: entitlement.willRenew,
        };
      }

      return {
        isActive: false,
        productId: null,
        expirationDate: null,
        originalPurchaseDate: null,
        isTrial: false,
        willRenew: false,
      };
    } catch (error) {
      Logger.error('Failed to get subscription status', error);
      throw new Error('サブスクリプション状態の取得に失敗しました');
    }
  }

  /**
   * 利用可能な商品・オファリングを取得
   */
  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    try {
      await this.ensureInitialized();
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        Logger.success('Available packages loaded', offerings.current.availablePackages.length);
        return offerings.current.availablePackages;
      }

      Logger.warn('No available packages found');
      return [];
    } catch (error) {
      Logger.error('Failed to get available packages', error);
      throw new Error('商品情報の取得に失敗しました');
    }
  }

  /**
   * 商品を購入
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
    try {
      await this.ensureInitialized();
      
      Logger.info('Starting purchase', pkg.identifier);
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
      
      // 購入成功の確認
      const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
      if (entitlement) {
        Logger.success('Purchase successful', productIdentifier);
        return { success: true, customerInfo };
      }

      Logger.warn('Purchase completed but entitlement not active');
      return { success: false };
    } catch (error: any) {
      Logger.error('Purchase failed', error);
      
      // エラータイプに応じた処理
      if (error.code === 'PURCHASE_CANCELLED') {
        throw new Error('購入がキャンセルされました');
      } else if (error.code === 'PAYMENT_PENDING') {
        throw new Error('決済処理中です。しばらくお待ちください');
      } else if (error.code === 'PRODUCT_ALREADY_PURCHASED') {
        throw new Error('この商品は既に購入済みです');
      } else {
        throw new Error('購入処理に失敗しました');
      }
    }
  }

  /**
   * リストア処理（過去の購入履歴から復元）
   */
  async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
    try {
      await this.ensureInitialized();
      
      Logger.info('Starting restore purchases');
      const customerInfo = await Purchases.restorePurchases();
      
      const entitlement = customerInfo.entitlements.active[this.ENTITLEMENT_ID];
      if (entitlement) {
        Logger.success('Purchases restored successfully');
        return { success: true, customerInfo };
      }

      Logger.info('No active purchases found to restore');
      return { success: false };
    } catch (error) {
      Logger.error('Restore purchases failed', error);
      throw new Error('購入履歴の復元に失敗しました');
    }
  }

  /**
   * 料金プラン情報を取得
   */
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const packages = await this.getAvailablePackages();
      
      const plans: PricingPlan[] = packages.map(pkg => {
        const product = (pkg as any).storeProduct;
        
        return {
          id: pkg.identifier,
          title: this.getLocalizedTitle(pkg.identifier),
          description: this.getLocalizedDescription(pkg.identifier),
          price: product?.priceString || '¥1,000/月',
          features: this.getFeaturesList(),
          trialDays: this.getTrialDays(pkg),
          isPopular: pkg.identifier === this.PRODUCT_ID,
        };
      });

      return plans;
    } catch (error) {
      Logger.error('Failed to get pricing plans', error);
      return this.getDefaultPricingPlans();
    }
  }

  /**
   * プレミアム機能の利用可否をチェック
   */
  async isPremiumUser(): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.isActive;
    } catch (error) {
      Logger.error('Failed to check premium status', error);
      return false;
    }
  }

  /**
   * 無料トライアルの残り日数を取得
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    try {
      const status = await this.getSubscriptionStatus();
      
      if (status.isTrial && status.expirationDate) {
        const now = new Date();
        const diffTime = status.expirationDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      }

      return null;
    } catch (error) {
      Logger.error('Failed to get trial days remaining', error);
      return null;
    }
  }

  /**
   * サブスクリプションのキャンセル（ストア誘導）
   */
  async cancelSubscription(): Promise<void> {
    try {
      // iOS/Androidの設定画面に誘導する必要がある
      Logger.info('Subscription cancellation requires going to store settings');
      
      if (Platform.OS === 'ios') {
        throw new Error('iOSの設定 > Apple ID > サブスクリプションから解約してください');
      } else {
        throw new Error('Google Playストア > アカウント > 定期購入から解約してください');
      }
    } catch (error) {
      Logger.error('Cancel subscription guidance', error);
      throw error;
    }
  }

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private getLocalizedTitle(packageId: string): string {
    switch (packageId) {
      case this.PRODUCT_ID:
        return 'デリログ ベーシック';
      default:
        return 'ベーシックプラン';
    }
  }

  private getLocalizedDescription(packageId: string): string {
    switch (packageId) {
      case this.PRODUCT_ID:
        return '基本機能が使える月額プラン';
      default:
        return 'ベーシック機能をお楽しみください';
    }
  }

  private getFeaturesList(): string[] {
    return [
      '点呼記録（無制限）',
      'PDF出力（無制限）',
      '車両3台まで登録',
      '1年間のデータ保存',
      '運行記録機能',
      'リマインダー機能',
    ];
  }

  private getTrialDays(pkg: PurchasesPackage): number | undefined {
    // トライアル期間の情報を取得
    const product = (pkg as any).storeProduct;
    if (product.introPrice) {
      return 7; // 7日間無料トライアル
    }
    return undefined;
  }

  private getDefaultPricingPlans(): PricingPlan[] {
    return [
      {
        id: this.PRODUCT_ID,
        title: 'デリログ ベーシック',
        description: '基本機能が使える月額プラン',
        price: '¥1,000/月',
        features: this.getFeaturesList(),
        trialDays: 7,
        isPopular: true,
      },
    ];
  }
}

// シングルトンインスタンス
export const subscriptionService = new SubscriptionService();