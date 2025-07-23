/**
 * 前回値自動入力制限コンポーネント
 * 無料プランでは前回値の自動入力を制限し、ベーシックプランではフル機能
 */

import React, { useState, useEffect } from 'react';
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

interface AutoFillRestrictionProps {
  onFillValues: (values: any) => void;
  previousValues: any;
  inputCount: number; // 手動入力回数
  children?: React.ReactNode;
}

export default function AutoFillRestriction({
  onFillValues,
  previousValues,
  inputCount,
  children,
}: AutoFillRestrictionProps) {
  const { canAccess, currentPlan, upgradePrompt } = useFeatureAccess('autoFillPreviousValues');
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  // 手動入力回数に基づくアップグレード誘導
  useEffect(() => {
    if (!canAccess && inputCount >= 10 && !showUpgradeHint) {
      setShowUpgradeHint(true);
    }
  }, [canAccess, inputCount, showUpgradeHint]);

  const handleAutoFillAttempt = () => {
    if (canAccess) {
      // ベーシックプランでは前回値を自動入力
      onFillValues(previousValues);
    } else {
      // 無料プランではアップグレード促進モーダル表示
      setShowModal(true);
    }
  };

  const renderAutoFillButton = () => {
    if (!previousValues || Object.keys(previousValues).length === 0) {
      return null;
    }

    if (canAccess) {
      // ベーシックプランのフル機能
      return (
        <View style={styles.autoFillContainer}>
          <TouchableOpacity
            style={styles.autoFillButton}
            onPress={handleAutoFillAttempt}
            accessibilityLabel="前回値を自動入力"
          >
            <Ionicons name="refresh" size={20} color={colors.cream} />
            <Text style={styles.autoFillButtonText}>前回値を自動入力</Text>
          </TouchableOpacity>
          <Text style={styles.autoFillDescription}>
            前回の入力値が自動で設定されます
          </Text>
        </View>
      );
    } else {
      // 無料プランの制限UI
      return (
        <View style={styles.restrictedContainer}>
          <TouchableOpacity
            style={styles.restrictedButton}
            onPress={handleAutoFillAttempt}
            accessibilityLabel="前回値自動入力（ベーシックプラン機能）"
          >
            <View style={styles.restrictedButtonContent}>
              <Ionicons name="lock-closed" size={20} color={colors.darkGray} />
              <Text style={styles.restrictedButtonText}>前回値を自動入力</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>ベーシック</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.benefitContainer}>
            <Text style={styles.benefitText}>
              ✨ 毎日の入力が10秒で完了！
            </Text>
            {inputCount >= 10 && (
              <Text style={styles.stressMessage}>
                💡 {inputCount}回も手入力お疲れさまです
              </Text>
            )}
          </View>
        </View>
      );
    }
  };

  const renderInputStressNotice = () => {
    if (canAccess || inputCount < 10) return null;

    return (
      <View style={styles.stressNoticeContainer}>
        <View style={styles.stressNoticeHeader}>
          <Ionicons name="time" size={24} color={colors.warning} />
          <Text style={styles.stressNoticeTitle}>
            入力にお時間かかってませんか？
          </Text>
        </View>
        
        <View style={styles.timeComparisonContainer}>
          <View style={styles.timeComparison}>
            <Text style={styles.timeLabel}>現在（無料プラン）</Text>
            <Text style={styles.timeValue}>3分 × 2回/日 = 6分</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.darkGray} />
          <View style={styles.timeComparison}>
            <Text style={styles.timeLabel}>ベーシックプラン</Text>
            <Text style={[styles.timeValue, styles.improvedTime]}>30秒 × 2回/日 = 1分</Text>
          </View>
        </View>
        
        <View style={styles.savingsContainer}>
          <Text style={styles.savingsText}>
            月150分の時間節約 = 時給換算で2,500円以上の価値！
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.tryButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.tryButtonText}>14日間無料で試す</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAutoFillButton()}
      {renderInputStressNotice()}
      {children}
      
      {/* アップグレード促進モーダル */}
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="⚡ 毎日の入力が10秒で完了"
        message={`ベーシックプランなら前回値が自動入力されます。\n\n手動入力 ${inputCount}回、本当にお疲れさまでした。`}
        ctaText="自動入力を試す"
        value="月150分の時間節約"
        timesSaved="毎日6分 → 1分（83%削減）"
        scenario="input_stress"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  autoFillContainer: {
    marginBottom: 16,
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  autoFillButtonText: {
    marginLeft: 8,
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  autoFillDescription: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  restrictedContainer: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  restrictedButton: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.darkGray + '40',
  },
  restrictedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedButtonText: {
    marginLeft: 8,
    marginRight: 8,
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
  planBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  planBadgeText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: '600',
  },
  benefitContainer: {
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    marginBottom: 4,
  },
  stressMessage: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
  },
  stressNoticeContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  stressNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stressNoticeTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  timeComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeComparison: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  improvedTime: {
    color: colors.success,
  },
  savingsContainer: {
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  tryButton: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tryButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
});