/**
 * アップグレード促進モーダル
 * マネタイズ戦略に基づく効果的な誘導UI
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  ctaText: string;
  value?: string;
  timesSaved?: string;
  showTrialBadge?: boolean;
  scenario?: 'input_stress' | 'pdf_pain' | 'data_limit' | 'edit_deadline' | 'search_frustration';
}

export default function UpgradePromptModal({
  visible,
  onClose,
  title,
  message,
  ctaText,
  value,
  timesSaved,
  showTrialBadge = true,
  scenario,
}: UpgradePromptModalProps) {
  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  const getScenarioIcon = () => {
    switch (scenario) {
      case 'input_stress':
        return 'flash';
      case 'pdf_pain':
        return 'document-text';
      case 'data_limit':
        return 'calendar';
      case 'edit_deadline':
        return 'create';
      case 'search_frustration':
        return 'search';
      default:
        return 'star';
    }
  };

  const getScenarioColor = () => {
    switch (scenario) {
      case 'input_stress':
        return colors.success;
      case 'pdf_pain':
        return colors.orange;
      case 'data_limit':
        return colors.blue;
      case 'edit_deadline':
        return colors.warning;
      case 'search_frustration':
        return colors.purple;
      default:
        return colors.orange;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: getScenarioColor() + '20' }]}>
              <Ionicons 
                name={getScenarioIcon()} 
                size={32} 
                color={getScenarioColor()} 
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="閉じる"
            >
              <Ionicons name="close" size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          {/* タイトル */}
          <Text style={styles.title}>{title}</Text>

          {/* メッセージ */}
          <Text style={styles.message}>{message}</Text>

          {/* 価値提案 */}
          {value && (
            <View style={styles.valueContainer}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.valueText}>{value}</Text>
            </View>
          )}

          {/* 時間節約効果 */}
          {timesSaved && (
            <View style={styles.timesSavedContainer}>
              <Text style={styles.timesSavedLabel}>時間節約効果</Text>
              <Text style={styles.timesSavedText}>{timesSaved}</Text>
            </View>
          )}

          {/* 無料トライアル Badge */}
          {showTrialBadge && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>14日間無料トライアル</Text>
            </View>
          )}

          {/* 機能比較 */}
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonRow}>
              <View style={styles.planColumn}>
                <Text style={styles.planHeader}>無料プラン</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                  <Text style={styles.featureTextDisabled}>手動入力</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                  <Text style={styles.featureTextDisabled}>個別PDF出力</Text>
                </View>
              </View>
              
              <View style={styles.planColumn}>
                <Text style={[styles.planHeader, styles.basicPlanHeader]}>ベーシックプラン</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.featureTextEnabled}>自動入力</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.featureTextEnabled}>一括PDF出力</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 料金情報 */}
          <View style={styles.pricingContainer}>
            <Text style={styles.priceText}>月額900円</Text>
            <Text style={styles.priceSubtext}>コーヒー3杯分で業務効率化</Text>
          </View>

          {/* アクションボタン */}
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            accessibilityLabel={ctaText}
          >
            <Text style={styles.upgradeButtonText}>{ctaText}</Text>
          </TouchableOpacity>

          {/* サブテキスト */}
          <Text style={styles.subtext}>
            いつでも解約可能・データは安全に保護
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 24,
    width: Math.min(width - 40, 400),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 12,
    lineHeight: 26,
  },
  message: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 20,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  valueText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  timesSavedContainer: {
    backgroundColor: colors.orange + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  timesSavedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 4,
  },
  timesSavedText: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '500',
  },
  trialBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 20,
  },
  trialText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonContainer: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planColumn: {
    flex: 1,
  },
  planHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  basicPlanHeader: {
    color: colors.orange,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureTextDisabled: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.darkGray,
  },
  featureTextEnabled: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.charcoal,
    fontWeight: '500',
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.orange,
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  upgradeButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
});