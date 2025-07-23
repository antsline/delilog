/**
 * データ表示制限バナーコンポーネント
 * 新しいマネタイズ戦略に基づく3ヶ月制限の表示
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStatus } from '@/store/subscriptionStore';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { featureLimitsManager } from '@/utils/featureLimits';
import { useAuth } from '@/hooks/useAuth';
import { TenkoService } from '@/services/tenkoService';
import { getMonthsAgo, getDaysDifference, formatDateToYYYYMMDD, parseJapanDateString } from '@/utils/dateUtils';

export default function DataViewLimitBanner() {
  const { isBasic } = useSubscriptionStatus();
  const { user } = useAuth();
  const [restrictedRecordsCount, setRestrictedRecordsCount] = useState(0);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [oldestRecordDate, setOldestRecordDate] = useState<Date | null>(null);

  // ベーシックプランユーザーには表示しない
  if (isBasic) {
    return null;
  }

  useEffect(() => {
    const checkDataRestrictions = async () => {
      if (!user) return;

      try {
        // 全記録数を取得
        const allRecords = await TenkoService.getAllUserRecords(user.id);
        setTotalRecordsCount(allRecords.length);

        if (allRecords.length === 0) return;

        // 3ヶ月以前の記録をカウント（日本時間ベース）
        const threeMonthsAgoString = getMonthsAgo(3);
        const threeMonthsAgoDate = parseJapanDateString(threeMonthsAgoString);

        const restrictedRecords = allRecords.filter(record => {
          const recordDate = parseJapanDateString(record.date);
          return recordDate < threeMonthsAgoDate;
        });
        
        setRestrictedRecordsCount(restrictedRecords.length);

        // 最古の記録日を取得
        if (allRecords.length > 0) {
          const sortedRecords = allRecords.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setOldestRecordDate(new Date(sortedRecords[0].date));
        }
      } catch (error) {
        console.error('Failed to check data restrictions:', error);
      }
    };

    checkDataRestrictions();
  }, [user]);

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  const getMonthsAgoCount = () => {
    if (!oldestRecordDate) return 0;
    const now = new Date();
    return Math.floor(getDaysDifference(now, oldestRecordDate) / 30);
  };

  // 制限された記録がない場合は表示しない
  if (restrictedRecordsCount === 0) {
    return null;
  }

  const monthsAgo = getMonthsAgo();
  const viewableRecords = totalRecordsCount - restrictedRecordsCount;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="eye-off" size={20} color={colors.warning} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {restrictedRecordsCount}件の記録が非表示
            </Text>
            <Text style={styles.subtitle}>
              3ヶ月以前の記録（{monthsAgo}ヶ月分）
            </Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              // 制限説明のモーダルを表示
            }}
          >
            <Ionicons name="information-circle" size={16} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        {/* データ状況の可視化 */}
        <View style={styles.dataVisualization}>
          <View style={styles.dataStats}>
            <View style={styles.dataStat}>
              <Text style={styles.dataStatNumber}>{viewableRecords}</Text>
              <Text style={styles.dataStatLabel}>表示可能</Text>
            </View>
            <View style={styles.dataSeparator} />
            <View style={styles.dataStat}>
              <Text style={[styles.dataStatNumber, styles.hiddenNumber]}>
                {restrictedRecordsCount}
              </Text>
              <Text style={styles.dataStatLabel}>非表示</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    width: `${(viewableRecords / totalRecordsCount) * 100}%`,
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((viewableRecords / totalRecordsCount) * 100)}%表示中
            </Text>
          </View>
        </View>

        {/* 安心メッセージ */}
        <View style={styles.assuranceContainer}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.assuranceText}>
            データは安全に保存されています
          </Text>
        </View>

        {/* アップグレードボタン */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          accessibilityLabel="ベーシックプランで全データを表示"
        >
          <Ionicons name="eye" size={16} color={colors.cream} />
          <Text style={styles.upgradeButtonText}>
            {monthsAgo}ヶ月分のデータを表示する
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.cream} />
        </TouchableOpacity>

        {/* または選択肢 */}
        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={() => {
            // データエクスポート画面へ
            router.push('/settings/data-management');
          }}
        >
          <Text style={styles.alternativeButtonText}>
            全データをダウンロードして自分で管理
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.card,
    marginHorizontal: 0,
    backgroundColor: colors.warning + '08',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning + '20',
    padding: 20,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.darkGray,
  },
  infoButton: {
    padding: 4,
  },
  dataVisualization: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  dataStat: {
    alignItems: 'center',
  },
  dataStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  hiddenNumber: {
    color: colors.warning,
  },
  dataStatLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  dataSeparator: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.light,
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
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
    minWidth: 60,
    textAlign: 'right',
  },
  assuranceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  assuranceText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  alternativeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  alternativeButtonText: {
    fontSize: 13,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
});