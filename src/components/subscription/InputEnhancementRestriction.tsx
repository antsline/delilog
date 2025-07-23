/**
 * 入力支援機能制限コンポーネント
 * 音声入力・テンプレート保存・コピー機能の制限管理
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useFeatureAccess } from '@/utils/featureLimits';
import UpgradePromptModal from './UpgradePromptModal';

interface InputEnhancementRestrictionProps {
  featureType: 'voiceInput' | 'templateSave' | 'copyFunction';
  onFeatureActivate?: () => void;
  templateCount?: number;
  currentValue?: any;
  children?: React.ReactNode;
}

export default function InputEnhancementRestriction({
  featureType,
  onFeatureActivate,
  templateCount = 0,
  currentValue,
  children,
}: InputEnhancementRestrictionProps) {
  const { canAccess, currentPlan } = useFeatureAccess(featureType);
  const [showModal, setShowModal] = useState(false);

  const getFeatureConfig = () => {
    switch (featureType) {
      case 'voiceInput':
        return {
          name: '音声入力',
          icon: 'mic' as const,
          description: '声で記録を入力',
          benefit: '手入力の時間を大幅短縮',
          modalTitle: '🎤 声で入力できたら...',
          modalMessage: 'ベーシックプランなら音声で記録を入力できます。\n\n運転中でも安全に、素早く記録が可能です。',
          ctaText: '音声入力を試す',
        };
      case 'templateSave':
        return {
          name: 'テンプレート保存',
          icon: 'bookmark' as const,
          description: 'よく使う入力値を保存',
          benefit: '定型入力を1タップで完了',
          modalTitle: '📝 定型入力を保存できたら...',
          modalMessage: 'ベーシックプランならよく使う入力値をテンプレートとして保存できます。\n\n毎回同じ入力をする手間が省けます。',
          ctaText: 'テンプレート機能を試す',
        };
      case 'copyFunction':
        return {
          name: 'コピー機能',
          icon: 'copy' as const,
          description: '前日の記録をコピー',
          benefit: '前日と同じ内容を瞬時に複製',
          modalTitle: '📋 前日をコピーできたら...',
          modalMessage: 'ベーシックプランなら前日の記録をワンタップでコピーできます。\n\n同じ内容の繰り返し入力から解放されます。',
          ctaText: 'コピー機能を試す',
        };
    }
  };

  const handleFeatureAttempt = () => {
    if (canAccess && onFeatureActivate) {
      onFeatureActivate();
    } else {
      setShowModal(true);
    }
  };

  const renderFeatureButton = () => {
    const config = getFeatureConfig();

    if (canAccess) {
      // ベーシックプランのフル機能
      return (
        <TouchableOpacity
          style={styles.featureButton}
          onPress={handleFeatureAttempt}
          accessibilityLabel={config.name}
        >
          <Ionicons name={config.icon} size={20} color={colors.cream} />
          <Text style={styles.featureButtonText}>{config.name}</Text>
        </TouchableOpacity>
      );
    } else {
      // 無料プランの制限UI
      return (
        <View style={styles.restrictedFeatureContainer}>
          <TouchableOpacity
            style={styles.restrictedFeatureButton}
            onPress={handleFeatureAttempt}
            accessibilityLabel={`${config.name}（ベーシックプラン機能）`}
          >
            <View style={styles.restrictedFeatureContent}>
              <View style={styles.iconWithLock}>
                <Ionicons name={config.icon} size={20} color={colors.darkGray} />
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={12} color={colors.darkGray} />
                </View>
              </View>
              <View style={styles.restrictedFeatureText}>
                <Text style={styles.restrictedFeatureName}>{config.name}</Text>
                <Text style={styles.restrictedFeatureDescription}>
                  {config.description}
                </Text>
              </View>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>ベーシック</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.benefitContainer}>
            <Ionicons name="flash" size={16} color={colors.orange} />
            <Text style={styles.benefitText}>{config.benefit}</Text>
          </View>
        </View>
      );
    }
  };

  const renderSpecializedContent = () => {
    if (featureType === 'templateSave' && !canAccess) {
      return (
        <View style={styles.templateShowcaseContainer}>
          <View style={styles.templateShowcaseHeader}>
            <Ionicons name="layers" size={20} color={colors.orange} />
            <Text style={styles.templateShowcaseTitle}>
              テンプレート例
            </Text>
          </View>
          
          <View style={styles.templateExamples}>
            <View style={styles.templateExample}>
              <Text style={styles.templateExampleTitle}>「通常運行」</Text>
              <Text style={styles.templateExampleContent}>
                健康状態: 良好、アルコール: 0.00、点検: 完了
              </Text>
            </View>
            <View style={styles.templateExample}>
              <Text style={styles.templateExampleTitle}>「短距離配送」</Text>
              <Text style={styles.templateExampleContent}>
                車両: 軽トラック、運行区域: 市内配送
              </Text>
            </View>
          </View>

          <Text style={styles.templateBenefit}>
            よく使う組み合わせを保存して、1タップで入力完了！
          </Text>
        </View>
      );
    }

    if (featureType === 'voiceInput' && !canAccess) {
      return (
        <View style={styles.voiceShowcaseContainer}>
          <View style={styles.voiceShowcaseHeader}>
            <Ionicons name="volume-high" size={20} color={colors.success} />
            <Text style={styles.voiceShowcaseTitle}>
              音声入力デモ
            </Text>
          </View>
          
          <View style={styles.voiceDemoContainer}>
            <View style={styles.voiceDemoStep}>
              <Text style={styles.voiceDemoNumber}>1</Text>
              <Text style={styles.voiceDemoText}>「健康状態良好」</Text>
            </View>
            <View style={styles.voiceDemoStep}>
              <Text style={styles.voiceDemoNumber}>2</Text>
              <Text style={styles.voiceDemoText}>「アルコール濃度ゼロ」</Text>
            </View>
            <View style={styles.voiceDemoStep}>
              <Text style={styles.voiceDemoNumber}>3</Text>
              <Text style={styles.voiceDemoText}>「日常点検完了」</Text>
            </View>
          </View>

          <Text style={styles.voiceBenefit}>
            運転中でも安全に、ハンズフリーで記録完了！
          </Text>
        </View>
      );
    }

    return null;
  };

  const config = getFeatureConfig();

  return (
    <View style={styles.container}>
      {renderFeatureButton()}
      {renderSpecializedContent()}
      {children}
      
      {/* アップグレード促進モーダル */}
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={config.modalTitle}
        message={config.modalMessage}
        ctaText={config.ctaText}
        value={config.benefit}
        scenario="input_stress"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  featureButtonText: {
    marginLeft: 6,
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  restrictedFeatureContainer: {
    backgroundColor: colors.beige,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  restrictedFeatureButton: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.darkGray + '30',
  },
  restrictedFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWithLock: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.cream,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restrictedFeatureText: {
    marginLeft: 12,
    flex: 1,
  },
  restrictedFeatureName: {
    color: colors.darkGray,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  restrictedFeatureDescription: {
    color: colors.darkGray,
    fontSize: 11,
  },
  planBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: colors.cream,
    fontSize: 9,
    fontWeight: '600',
  },
  benefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
  },
  templateShowcaseContainer: {
    backgroundColor: colors.orange + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  templateShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateShowcaseTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  templateExamples: {
    gap: 8,
    marginBottom: 12,
  },
  templateExample: {
    backgroundColor: colors.cream,
    borderRadius: 6,
    padding: 8,
  },
  templateExampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 2,
  },
  templateExampleContent: {
    fontSize: 11,
    color: colors.darkGray,
  },
  templateBenefit: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
    textAlign: 'center',
  },
  voiceShowcaseContainer: {
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  voiceShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceShowcaseTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  voiceDemoContainer: {
    gap: 6,
    marginBottom: 12,
  },
  voiceDemoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 6,
    padding: 8,
  },
  voiceDemoNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    color: colors.cream,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 8,
  },
  voiceDemoText: {
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  voiceBenefit: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
});