/**
 * 機能制限バナーコンポーネント
 * 無料版の制限表示とアップグレード促進
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStatus } from '@/store/subscriptionStore';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface FeatureLimitBannerProps {
  feature: string;
  currentUsage: number;
  limit: number;
  message?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

export function FeatureLimitBanner({
  feature,
  currentUsage,
  limit,
  message,
  showUpgradeButton = true,
  onUpgrade,
}: FeatureLimitBannerProps) {
  const { isBasic } = useSubscriptionStatus();

  // ベーシックプランユーザーには表示しない
  if (isBasic) {
    return null;
  }

  // 無制限の場合は表示しない
  if (limit === -1) {
    return null;
  }

  const remaining = Math.max(0, limit - currentUsage);
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  const getBannerStyle = () => {
    if (isAtLimit) {
      return [styles.banner, styles.bannerError];
    } else if (isNearLimit) {
      return [styles.banner, styles.bannerWarning];
    } else {
      return [styles.banner, styles.bannerInfo];
    }
  };

  const getIconName = () => {
    if (isAtLimit) {
      return 'ban' as const;
    } else if (isNearLimit) {
      return 'warning' as const;
    } else {
      return 'information-circle' as const;
    }
  };

  const getIconColor = () => {
    if (isAtLimit) {
      return colors.error;
    } else if (isNearLimit) {
      return colors.warning;
    } else {
      return colors.info;
    }
  };

  return (
    <View style={getBannerStyle()}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons 
            name={getIconName()} 
            size={20} 
            color={getIconColor()} 
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isAtLimit ? '制限に達しました' : `制限まで残り${remaining}件`}
            </Text>
            <Text style={styles.subtitle}>
              {message || `${currentUsage}/${limit === -1 ? '無制限' : limit}件使用中`}
            </Text>
          </View>
        </View>

        {/* プログレスバー */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, percentage)}%`,
                  backgroundColor: isAtLimit 
                    ? colors.error 
                    : isNearLimit 
                    ? colors.warning 
                    : colors.success,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(percentage)}%
          </Text>
        </View>

        {/* アップグレードボタン */}
        {showUpgradeButton && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            accessibilityLabel="プレミアムプランにアップグレード"
          >
            <Ionicons name="star" size={16} color={colors.cream} />
            <Text style={styles.upgradeButtonText}>
              ベーシックプランにアップグレード
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.cream} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface PremiumFeatureBlockProps {
  featureName: string;
  description: string;
  icon?: string;
  onUpgrade?: () => void;
}

export function PremiumFeatureBlock({
  featureName,
  description,
  icon = 'star',
  onUpgrade,
}: PremiumFeatureBlockProps) {
  const { isBasic } = useSubscriptionStatus();

  // ベーシックプランユーザーには表示しない
  if (isBasic) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <View style={styles.premiumBlock}>
      <View style={styles.premiumIcon}>
        <Ionicons name={icon as any} size={24} color={colors.orange} />
      </View>
      
      <View style={styles.premiumContent}>
        <Text style={styles.premiumTitle}>{featureName}</Text>
        <Text style={styles.premiumDescription}>{description}</Text>
        
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={handleUpgrade}
          accessibilityLabel={`${featureName}を使用するためにアップグレード`}
        >
          <Text style={styles.premiumButtonText}>
            ベーシックプランで解放
          </Text>
          <Ionicons name="lock-open" size={16} color={colors.cream} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface UpgradePromptProps {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function showUpgradePrompt({
  title,
  message,
  confirmText = 'ベーシックプランを見る',
  onConfirm,
  onCancel,
}: UpgradePromptProps) {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'キャンセル',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'default',
        onPress: () => {
          if (onConfirm) {
            onConfirm();
          } else {
            router.push('/subscription');
          }
        },
      },
    ],
    { cancelable: true }
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.card,
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerInfo: {
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
  },
  bannerWarning: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '30',
  },
  bannerError: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.beige,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.darkGray,
    minWidth: 35,
    textAlign: 'right',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  upgradeButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBlock: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.orange + '30',
    padding: 16,
    marginBottom: spacing.card,
    marginHorizontal: 0,
    gap: 16,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.orange + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumContent: {
    flex: 1,
    gap: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  premiumDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '600',
  },
});