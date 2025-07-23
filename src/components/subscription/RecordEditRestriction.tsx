/**
 * 記録修正期限制限コンポーネント
 * 無料プランは当日のみ、ベーシックプランは7日間修正可能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useRecordEditAccess } from '@/utils/featureLimits';
import UpgradePromptModal from './UpgradePromptModal';

interface RecordEditRestrictionProps {
  recordDate: Date;
  onEdit?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  recordType?: 'tenko' | 'daily_check' | 'operation';
}

export default function RecordEditRestriction({
  recordDate,
  onEdit,
  onCancel,
  children,
  recordType = 'tenko',
}: RecordEditRestrictionProps) {
  const { canEdit, accessResult, isLoading } = useRecordEditAccess(recordDate);
  const [showModal, setShowModal] = useState(false);

  const getRecordTypeName = () => {
    switch (recordType) {
      case 'tenko':
        return '点呼記録';
      case 'daily_check':
        return '日常点検';
      case 'operation':
        return '運行記録';
      default:
        return '記録';
    }
  };

  const getDaysAgo = () => {
    const now = new Date();
    const diffTime = now.getTime() - recordDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditAttempt = () => {
    if (canEdit && onEdit) {
      onEdit();
    } else {
      setShowModal(true);
    }
  };

  const renderEditButton = () => {
    const daysAgo = getDaysAgo();
    const recordTypeName = getRecordTypeName();

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>権限を確認中...</Text>
        </View>
      );
    }

    if (canEdit) {
      // 修正可能な場合
      return (
        <View style={styles.editContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditAttempt}
            accessibilityLabel={`${recordTypeName}を修正`}
          >
            <Ionicons name="create" size={20} color={colors.cream} />
            <Text style={styles.editButtonText}>修正する</Text>
          </TouchableOpacity>
          <Text style={styles.editAllowedText}>
            {daysAgo === 0 
              ? '当日の記録のため修正可能です'
              : `${daysAgo}日前の記録のため修正可能です`
            }
          </Text>
        </View>
      );
    } else {
      // 修正不可能な場合
      return (
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedHeader}>
            <Ionicons name="lock-closed" size={24} color={colors.error} />
            <Text style={styles.restrictedTitle}>修正期限を過ぎています</Text>
          </View>

          <View style={styles.recordInfo}>
            <Text style={styles.recordDate}>
              {recordDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </Text>
            <Text style={styles.daysAgoText}>
              {daysAgo}日前の{recordTypeName}
            </Text>
          </View>

          <View style={styles.limitExplanation}>
            <Text style={styles.limitExplanationText}>
              無料プランでは当日のみ修正可能です。
            </Text>
            <Text style={styles.upgradeHint}>
              ベーシックプランなら7日間修正できます。
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, styles.upgradeOption]}
              onPress={() => setShowModal(true)}
            >
              <View style={styles.optionContent}>
                <Ionicons name="arrow-up-circle" size={20} color={colors.orange} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>7日間修正可能にする</Text>
                  <Text style={styles.optionSubtext}>ベーシックプラン（月額900円）</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.orange} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.recreateOption]}
              onPress={() => {
                Alert.alert(
                  '新規作成',
                  `新しい${recordTypeName}を作成しますか？\n\n過去の記録は修正できませんが、新規で作成することは可能です。`,
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    { 
                      text: '新規作成', 
                      onPress: () => {
                        // TODO: 新規作成画面へ遷移
                        if (onEdit) onEdit();
                      }
                    }
                  ]
                );
              }}
            >
              <View style={styles.optionContent}>
                <Ionicons name="add-circle" size={20} color={colors.success} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>新規作成する</Text>
                  <Text style={styles.optionSubtext}>新しい記録として作成</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.success} />
            </TouchableOpacity>
          </View>

          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark" size={16} color={colors.blue} />
            <Text style={styles.safetyNoteText}>
              記録の正確性を保つため、修正期限を設けています
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderEditButton()}
      {children}
      
      {/* アップグレード促進モーダル */}
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="🛡️ 修正できなくてお困りですか？"
        message={`ベーシックプランなら7日間修正可能で安心です。\n\n${getDaysAgo()}日前の記録も修正できるようになります。`}
        ctaText="修正機能を試す"
        value="安心の修正期限"
        timesSaved="ストレス軽減・業務効率化"
        scenario="edit_deadline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  editContainer: {
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButtonText: {
    marginLeft: 8,
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  editAllowedText: {
    fontSize: 12,
    color: colors.success,
    textAlign: 'center',
  },
  restrictedContainer: {
    backgroundColor: colors.error + '05',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.error + '20',
  },
  restrictedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  restrictedTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
  },
  recordInfo: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  daysAgoText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  limitExplanation: {
    backgroundColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  limitExplanationText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 4,
    textAlign: 'center',
  },
  upgradeHint: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  upgradeOption: {
    borderColor: colors.orange + '40',
    backgroundColor: colors.orange + '05',
  },
  recreateOption: {
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '05',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue + '10',
    borderRadius: 8,
    padding: 12,
  },
  safetyNoteText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.blue,
    flex: 1,
  },
});