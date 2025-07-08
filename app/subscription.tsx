/**
 * サブスクリプション・課金画面
 * 料金プラン表示と購入フロー
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore, useSubscriptionStatus } from '@/store/subscriptionStore';
import { PricingPlan } from '@/services/subscriptionService';
import { colors } from '@/constants/colors';
import { Logger } from '@/utils/logger';

export default function SubscriptionScreen() {
  const {
    pricingPlans,
    isLoading,
    error,
    loadPricingPlans,
    purchaseSubscription,
    restorePurchases,
    clearError,
  } = useSubscriptionStore();
  
  const { isBasic, trialDaysRemaining } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await loadPricingPlans();
    } catch (error) {
      Logger.error('Failed to load plans', error);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);
      setSelectedPlan(planId);

      const success = await purchaseSubscription(planId);
      
      if (success) {
        Alert.alert(
          '購入完了',
          'ベーシック機能をご利用いただけます。',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('購入エラー', error.message);
    } finally {
      setIsPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestore = async () => {
    try {
      const success = await restorePurchases();
      
      if (success) {
        Alert.alert(
          '復元完了',
          '購入履歴が復元されました。',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          '復元結果',
          '復元できる購入履歴が見つかりませんでした。'
        );
      }
    } catch (error: any) {
      Alert.alert('復元エラー', error.message);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityLabel="戻る"
      >
        <Ionicons name="arrow-back" size={24} color={colors.charcoal} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>ベーシックプラン</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderCurrentStatus = () => {
    if (isBasic) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statusText}>ベーシック会員</Text>
          </View>
          {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <Text style={styles.trialText}>
              無料トライアル残り{trialDaysRemaining}日
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.freeUserText}>現在：無料プラン</Text>
        <Text style={styles.upgradeText}>
          ベーシックプランで基本機能をお楽しみください
        </Text>
      </View>
    );
  };

  const renderFeatureList = () => (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>ベーシック機能</Text>
      {[
        { icon: 'infinite', text: '点呼記録（無制限）' },
        { icon: 'document', text: 'PDF出力（無制限）' },
        { icon: 'car', text: '車両3台まで登録' },
        { icon: 'time', text: '1年間のデータ保存' },
        { icon: 'list', text: '運行記録機能' },
        { icon: 'notifications', text: 'リマインダー機能' },
      ].map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name={feature.icon as any} size={20} color={colors.orange} />
          <Text style={styles.featureText}>{feature.text}</Text>
        </View>
      ))}
    </View>
  );

  const renderPricingPlan = (plan: PricingPlan) => (
    <View key={plan.id} style={[
      styles.planContainer,
      plan.isPopular && styles.popularPlan
    ]}>
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>おすすめ</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>{plan.price}</Text>
        {plan.originalPrice && (
          <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
        )}
      </View>

      {plan.trialDays && (
        <Text style={styles.trialInfo}>
          {plan.trialDays}日間無料トライアル
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          isBasic && styles.purchaseButtonDisabled,
          selectedPlan === plan.id && styles.purchaseButtonLoading,
        ]}
        onPress={() => handlePurchase(plan.id)}
        disabled={isBasic || isPurchasing}
        accessibilityLabel={`${plan.title}を購入`}
      >
        {selectedPlan === plan.id && isPurchasing ? (
          <ActivityIndicator color={colors.cream} size="small" />
        ) : (
          <Text style={[
            styles.purchaseButtonText,
            isBasic && styles.purchaseButtonTextDisabled,
          ]}>
            {isBasic ? '購入済み' : '購入する'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        accessibilityLabel="購入履歴を復元"
      >
        <Text style={styles.restoreButtonText}>購入履歴を復元</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        購入により、利用規約とプライバシーポリシーに同意したものとみなします。
        サブスクリプションは自動更新され、解約はいつでも可能です。
      </Text>

      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() => router.push('/settings/terms-of-service')}
        >
          <Text style={styles.linkText}>利用規約</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>・</Text>
        <TouchableOpacity
          onPress={() => router.push('/settings/privacy-policy')}
        >
          <Text style={styles.linkText}>プライバシーポリシー</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && pricingPlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              clearError();
              loadPlans();
            }}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStatus()}
        {renderFeatureList()}
        
        <View style={styles.plansContainer}>
          <Text style={styles.plansTitle}>料金プラン</Text>
          {pricingPlans.map(renderPricingPlan)}
        </View>
        
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.cream,
    fontWeight: '600',
  },
  statusContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  trialText: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '500',
  },
  freeUserText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  featuresContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 15,
    color: colors.charcoal,
  },
  plansContainer: {
    margin: 16,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 16,
  },
  planContainer: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  popularPlan: {
    borderColor: colors.orange,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.orange,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.orange,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.darkGray,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  trialInfo: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    marginBottom: 16,
  },
  purchaseButton: {
    backgroundColor: colors.orange,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: colors.beige,
  },
  purchaseButtonLoading: {
    backgroundColor: colors.darkGray,
  },
  purchaseButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButtonTextDisabled: {
    color: colors.darkGray,
  },
  footer: {
    margin: 16,
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  restoreButtonText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: colors.orange,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  separator: {
    color: colors.darkGray,
    fontSize: 12,
    marginHorizontal: 8,
  },
});