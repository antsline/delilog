/**
 * PDF一括出力制限コンポーネント
 * 無料プランでは個別出力のみ、ベーシックプランでは一括出力可能
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
import { useFeatureAccess } from '@/utils/featureLimits';
import UpgradePromptModal from './UpgradePromptModal';

interface PDFBulkExportRestrictionProps {
  onBulkExport: () => void;
  onIndividualExport: () => void;
  exportCount: number; // 個別出力回数
  children?: React.ReactNode;
  exportType: 'weekly' | 'monthly' | 'custom';
}

export default function PDFBulkExportRestriction({
  onBulkExport,
  onIndividualExport,
  exportCount,
  children,
  exportType,
}: PDFBulkExportRestrictionProps) {
  const { canAccess, currentPlan } = useFeatureAccess('pdfBulkExport');
  const [showModal, setShowModal] = useState(false);
  const [showPainReminder, setShowPainReminder] = useState(false);

  // 個別出力回数に基づく苦痛度表示
  useEffect(() => {
    if (!canAccess && exportCount >= 5) {
      setShowPainReminder(true);
    }
  }, [canAccess, exportCount]);

  const getExportDescription = () => {
    switch (exportType) {
      case 'weekly':
        return { period: '週間', fileCount: 7, description: '7日分を1つのファイルに' };
      case 'monthly':
        return { period: '月間', fileCount: 30, description: '1ヶ月分を1つのファイルに' };
      case 'custom':
        return { period: '期間', fileCount: 'N', description: '指定期間を1つのファイルに' };
    }
  };

  const handleBulkExportAttempt = () => {
    if (canAccess) {
      onBulkExport();
    } else {
      setShowModal(true);
    }
  };

  const renderExportOptions = () => {
    const { period, fileCount, description } = getExportDescription();

    if (canAccess) {
      // ベーシックプランのフル機能
      return (
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={styles.bulkExportButton}
            onPress={handleBulkExportAttempt}
            accessibilityLabel={`${period}一括PDF出力`}
          >
            <View style={styles.bulkExportContent}>
              <Ionicons name="documents" size={24} color={colors.cream} />
              <View style={styles.bulkExportText}>
                <Text style={styles.bulkExportTitle}>{period}一括出力</Text>
                <Text style={styles.bulkExportDescription}>{description}</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.individualExportButton}
            onPress={onIndividualExport}
            accessibilityLabel="個別PDF出力"
          >
            <Ionicons name="document" size={20} color={colors.orange} />
            <Text style={styles.individualExportText}>個別出力</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // 無料プランの制限UI
      return (
        <View style={styles.restrictedContainer}>
          {/* 制限されたバルク出力ボタン */}
          <TouchableOpacity
            style={styles.restrictedBulkButton}
            onPress={handleBulkExportAttempt}
            accessibilityLabel={`${period}一括PDF出力（ベーシックプラン機能）`}
          >
            <View style={styles.restrictedBulkContent}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={20} color={colors.darkGray} />
              </View>
              <View style={styles.restrictedText}>
                <Text style={styles.restrictedTitle}>{period}一括出力</Text>
                <Text style={styles.restrictedDescription}>{description}</Text>
              </View>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>ベーシック</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 個別出力ボタン（利用可能） */}
          <TouchableOpacity
            style={styles.availableIndividualButton}
            onPress={onIndividualExport}
            accessibilityLabel="個別PDF出力（利用可能）"
          >
            <Ionicons name="document" size={20} color={colors.success} />
            <Text style={styles.availableIndividualText}>個別出力（利用可能）</Text>
            <Text style={styles.availableIndividualNote}>1日ずつ出力</Text>
          </TouchableOpacity>

          {/* 作業負荷の比較表示 */}
          <View style={styles.workloadContainer}>
            <Text style={styles.workloadTitle}>作業量の比較</Text>
            <View style={styles.workloadComparison}>
              <View style={styles.workloadItem}>
                <Text style={styles.workloadLabel}>現在（無料プラン）</Text>
                <Text style={styles.workloadValue}>
                  {typeof fileCount === 'number' ? `${fileCount}回の作業` : 'N回の作業'}
                </Text>
                <Text style={styles.workloadDetail}>1日ずつ個別出力</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.darkGray} />
              <View style={styles.workloadItem}>
                <Text style={styles.workloadLabel}>ベーシックプラン</Text>
                <Text style={[styles.workloadValue, styles.improvedWorkload]}>1回の作業</Text>
                <Text style={styles.workloadDetail}>一括出力</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const renderPainReminder = () => {
    if (canAccess || !showPainReminder) return null;

    const { fileCount } = getExportDescription();
    const estimatedMinutes = typeof fileCount === 'number' ? fileCount * 2 : 20;

    return (
      <View style={styles.painReminderContainer}>
        <View style={styles.painReminderHeader}>
          <Ionicons name="time-outline" size={24} color={colors.warning} />
          <Text style={styles.painReminderTitle}>
            個別出力、お疲れさまです
          </Text>
        </View>
        
        <View style={styles.painStats}>
          <Text style={styles.painStatsText}>
            これまでに {exportCount} 回の個別出力を実行されました
          </Text>
          <Text style={styles.estimateText}>
            推定所要時間: 約{estimatedMinutes}分
          </Text>
        </View>

        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>💡 ベーシックプランなら...</Text>
          <View style={styles.solutionBenefit}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.solutionText}>
              {typeof fileCount === 'number' ? `${fileCount}回` : 'N回'} → 1回 で完了
            </Text>
          </View>
          <View style={styles.solutionBenefit}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.solutionText}>
              約{estimatedMinutes}分 → 1分 で完了
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.painSolutionButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.painSolutionButtonText}>
            一括出力を試してみる
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderExportOptions()}
      {renderPainReminder()}
      {children}
      
      {/* アップグレード促進モーダル */}
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="📄 まとめて出力できたら..."
        message={`ベーシックプランなら${getExportDescription().period}単位で一括出力。\n${
          typeof getExportDescription().fileCount === 'number' 
            ? `${getExportDescription().fileCount}回の作業が1回で完了`
            : '複数回の作業が1回で完了'
        }します。\n\n個別出力 ${exportCount}回、本当にお疲れさまでした。`}
        ctaText="一括出力を試す"
        value="大幅な時間短縮"
        timesSaved={`${typeof getExportDescription().fileCount === 'number' 
          ? getExportDescription().fileCount * 2 
          : 20}分 → 1分`}
        scenario="pdf_pain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  exportContainer: {
    gap: 12,
  },
  bulkExportButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    padding: 16,
  },
  bulkExportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkExportText: {
    marginLeft: 12,
    flex: 1,
  },
  bulkExportTitle: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bulkExportDescription: {
    color: colors.cream + 'DD',
    fontSize: 12,
  },
  individualExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.orange + '40',
  },
  individualExportText: {
    marginLeft: 8,
    color: colors.orange,
    fontSize: 14,
    fontWeight: '500',
  },
  restrictedContainer: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  restrictedBulkButton: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.darkGray + '40',
  },
  restrictedBulkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restrictedText: {
    marginLeft: 12,
    flex: 1,
  },
  restrictedTitle: {
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  restrictedDescription: {
    color: colors.darkGray,
    fontSize: 12,
  },
  planBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: '600',
  },
  availableIndividualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  availableIndividualText: {
    marginLeft: 8,
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  availableIndividualNote: {
    color: colors.success,
    fontSize: 10,
  },
  workloadContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: 12,
  },
  workloadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  workloadComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workloadItem: {
    flex: 1,
    alignItems: 'center',
  },
  workloadLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  workloadValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  improvedWorkload: {
    color: colors.success,
  },
  workloadDetail: {
    fontSize: 10,
    color: colors.darkGray,
  },
  painReminderContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  painReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  painReminderTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  painStats: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  painStatsText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 4,
  },
  estimateText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  solutionContainer: {
    marginBottom: 16,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  solutionBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  solutionText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  painSolutionButton: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  painSolutionButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
});