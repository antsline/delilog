/**
 * データ表示制限コンポーネント
 * 3ヶ月以前のデータへのアクセス制限を管理
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { featureLimitsManager } from '@/utils/featureLimits';
import UpgradePromptModal from './UpgradePromptModal';

interface DataViewRestrictionProps {
  targetDate: Date;
  children?: React.ReactNode;
  fallbackMessage?: string;
  showUpgradePrompt?: boolean;
}

export default function DataViewRestriction({
  targetDate,
  children,
  fallbackMessage,
  showUpgradePrompt = true,
}: DataViewRestrictionProps) {
  const [showModal, setShowModal] = useState(false);
  const [accessResult, setAccessResult] = useState<any>(null);

  React.useEffect(() => {
    const checkAccess = async () => {
      const result = await featureLimitsManager.checkDataViewAccess(targetDate);
      setAccessResult(result);
    };
    
    checkAccess();
  }, [targetDate]);

  const handleExportAllData = () => {
    Alert.alert(
      'データエクスポート',
      'すべてのデータをダウンロードして解約しますか？\n\n• 全ての点呼記録（CSV + PDF形式）\n• 車両データ\n• 設定情報\n\n解約後は自分でのデータ管理が必要になります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '全データをダウンロード', 
          style: 'destructive',
          onPress: () => {
            // TODO: データエクスポート機能を実装
            router.push('/settings/export-data');
          }
        },
      ]
    );
  };

  const renderRestrictionMessage = () => {
    if (!accessResult || accessResult.canAccess) {
      return children;
    }

    const daysDiff = accessResult.daysRestricted || 0;
    const monthsAgo = Math.floor(daysDiff / 30);

    return (
      <View style={styles.restrictionContainer}>
        {/* ロックアイコンと期間表示 */}
        <View style={styles.lockHeader}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={32} color={colors.warning} />
          </View>
          <View style={styles.periodInfo}>
            <Text style={styles.restrictedDateText}>
              {targetDate.toLocaleDateString('ja-JP')}
            </Text>
            <Text style={styles.periodText}>
              {monthsAgo}ヶ月前のデータ
            </Text>
          </View>
        </View>

        {/* 制限理由 */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonTitle}>このデータを見るには</Text>
          <Text style={styles.reasonText}>
            3ヶ月以前のデータはベーシックプランでご利用いただけます。
          </Text>
          <Text style={styles.assuranceText}>
            💾 データは安全に保存されています
          </Text>
        </View>

        {/* 選択肢の提示 */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>どちらを選びますか？</Text>
          
          {/* オプション1: アップグレード */}
          <TouchableOpacity
            style={[styles.optionButton, styles.upgradeOption]}
            onPress={() => setShowModal(true)}
          >
            <View style={styles.optionContent}>
              <Ionicons name="arrow-up-circle" size={24} color={colors.orange} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>ベーシックプランにする</Text>
                <Text style={styles.optionSubtext}>
                  月額900円 • 1年間のデータが見放題
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.orange} />
          </TouchableOpacity>

          {/* オプション2: データダウンロード */}
          <TouchableOpacity
            style={[styles.optionButton, styles.exportOption]}
            onPress={handleExportAllData}
          >
            <View style={styles.optionContent}>
              <Ionicons name="download" size={24} color={colors.darkGray} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>全データをダウンロード</Text>
                <Text style={styles.optionSubtext}>
                  解約して自分で管理する
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        {/* メッセージのカスタマイズ */}
        {fallbackMessage && (
          <Text style={styles.fallbackMessage}>
            {fallbackMessage}
          </Text>
        )}

        {/* アップグレード促進モーダル */}
        {showUpgradePrompt && (
          <UpgradePromptModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            title="📅 過去のデータをすべて確認"
            message={`${monthsAgo}ヶ月前のデータも含めて、すべての記録を確認できます。\n\nデータは決して消えません。アプリで見やすく管理し続けませんか？`}
            ctaText="1年間のデータを見る"
            value="安心の1年間履歴表示"
            scenario="data_limit"
          />
        )}
      </View>
    );
  };

  return renderRestrictionMessage();
}

const styles = StyleSheet.create({
  restrictionContainer: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: colors.warning + '30',
  },
  lockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodInfo: {
    flex: 1,
  },
  restrictedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  periodText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  reasonContainer: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  assuranceText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  upgradeOption: {
    borderColor: colors.orange + '40',
    backgroundColor: colors.orange + '05',
  },
  exportOption: {
    borderColor: colors.border.light,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 13,
    color: colors.darkGray,
  },
  fallbackMessage: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});