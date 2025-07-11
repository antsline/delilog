/**
 * 最適化された日記録カードコンポーネント
 * React.memo によるメモ化で不要な再レンダリングを防止
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface DayRecordCardProps {
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  hasBeforeRecord: boolean;
  hasAfterRecord: boolean;
  isComplete: boolean;
  isNoOperation: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

const DayRecordCard = React.memo<DayRecordCardProps>(({
  date,
  dayOfMonth,
  isToday,
  hasBeforeRecord,
  hasAfterRecord,
  isComplete,
  isNoOperation,
  isSaturday,
  isSunday,
  isWeekend,
  isHoliday,
}) => {
  // 記録状態を決定
  const getRecordStatus = React.useMemo(() => {
    if (isNoOperation) {
      return {
        icon: 'minus-circle' as const,
        color: colors.darkGray,
        text: '運行なし',
        bgColor: colors.beige,
      };
    }

    if (isComplete) {
      return {
        icon: 'check-circle' as const,
        color: colors.success,
        text: '完了',
        bgColor: colors.success + '20',
      };
    }

    if (hasBeforeRecord || hasAfterRecord) {
      return {
        icon: 'alert-circle' as const,
        color: colors.orange,
        text: '一部完了',
        bgColor: colors.orange + '20',
      };
    }

    return {
      icon: 'circle' as const,
      color: colors.darkGray,
      text: '未記録',
      bgColor: colors.cream,
    };
  }, [isNoOperation, isComplete, hasBeforeRecord, hasAfterRecord]);

  // 日付スタイルを決定
  const dayStyle = React.useMemo(() => [
    styles.dayNumber,
    isToday && styles.todayNumber,
    isSunday && styles.sundayNumber,
    isSaturday && styles.saturdayNumber,
  ], [isToday, isSunday, isSaturday]);

  // カードスタイルを決定
  const cardStyle = React.useMemo(() => [
    styles.dayCard,
    isToday && styles.todayCard,
    { backgroundColor: getRecordStatus.bgColor },
  ], [isToday, getRecordStatus.bgColor]);


  // 曜日名を取得
  const dayOfWeek = React.useMemo(() => {
    const dateObj = new Date(date);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return dayNames[dateObj.getDay()];
  }, [date]);

  // 曜日の色を決定
  const dayOfWeekColor = React.useMemo(() => {
    if (isSunday || isHoliday) return colors.error;
    if (isSaturday) return colors.saturday;
    return colors.charcoal;
  }, [isSunday, isSaturday, isHoliday]);

  return (
    <View style={cardStyle}>
      <View style={styles.cardContent}>
        {/* 左側: 日付と曜日 */}
        <View style={styles.dateSection}>
          <Text style={[styles.dayNumber, { color: dayOfWeekColor }]}>
            {dayOfMonth}日
          </Text>
          <Text style={[styles.dayOfWeek, { color: dayOfWeekColor }]}>
            ({dayOfWeek})
          </Text>
        </View>

        {/* 中央: 記録状態 */}
        <View style={styles.statusSection}>
          {isNoOperation ? (
            <View style={styles.noOperationStatus}>
              <Feather name="minus-circle" size={20} color={colors.darkGray} />
              <Text style={styles.noOperationText}>運行なし</Text>
            </View>
          ) : (
            <View style={styles.recordStatusContainer}>
              <View style={styles.recordRow}>
                <View style={styles.recordItem}>
                  <Feather 
                    name={hasBeforeRecord ? 'check-circle' : 'circle'} 
                    size={16} 
                    color={hasBeforeRecord ? colors.success : colors.darkGray} 
                  />
                  <Text style={[styles.recordLabel, { color: hasBeforeRecord ? colors.success : colors.darkGray }]}>
                    業務前
                  </Text>
                </View>
                <View style={styles.recordItem}>
                  <Feather 
                    name={hasAfterRecord ? 'check-circle' : 'circle'} 
                    size={16} 
                    color={hasAfterRecord ? colors.success : colors.darkGray} 
                  />
                  <Text style={[styles.recordLabel, { color: hasAfterRecord ? colors.success : colors.darkGray }]}>
                    業務後
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 右側: 完了状態アイコン */}
        <View style={styles.completionSection}>
          <Feather 
            name={getRecordStatus.icon} 
            size={24} 
            color={getRecordStatus.color} 
          />
        </View>
      </View>

    </View>
  );
});

DayRecordCard.displayName = 'DayRecordCard';

const styles = StyleSheet.create({
  dayCard: {
    minHeight: 72,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.beige,
    position: 'relative',
    backgroundColor: colors.cream,
  },
  todayCard: {
    borderColor: colors.charcoal,
    borderWidth: 2,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    lineHeight: 22,
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.charcoal,
    marginTop: 2,
  },
  statusSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordStatusContainer: {
    alignItems: 'center',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  noOperationStatus: {
    alignItems: 'center',
    gap: 4,
  },
  noOperationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
  },
  completionSection: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 40, // PDFボタンのスペースを確保
  },
});

export default DayRecordCard;