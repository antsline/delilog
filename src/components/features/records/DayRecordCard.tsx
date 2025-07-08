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
  onNoOperationToggle: (date: string) => void;
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
  onNoOperationToggle,
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
    isWeekend && styles.weekendCard,
    isToday && styles.todayCard,
    { backgroundColor: getRecordStatus.bgColor },
  ], [isWeekend, isToday, getRecordStatus.bgColor]);

  const handleToggleNoOperation = React.useCallback(() => {
    onNoOperationToggle(date);
  }, [date, onNoOperationToggle]);

  return (
    <View style={cardStyle}>
      {/* 日付表示 */}
      <Text style={dayStyle}>{dayOfMonth}</Text>
      
      {/* 記録状態アイコン */}
      <View style={styles.statusContainer}>
        <Feather 
          name={getRecordStatus.icon} 
          size={16} 
          color={getRecordStatus.color} 
        />
        <Text style={[styles.statusText, { color: getRecordStatus.color }]}>
          {getRecordStatus.text}
        </Text>
      </View>

      {/* 詳細情報 */}
      {!isNoOperation && (hasBeforeRecord || hasAfterRecord) && (
        <View style={styles.detailContainer}>
          {hasBeforeRecord && (
            <View style={[styles.recordBadge, styles.beforeBadge]}>
              <Text style={styles.badgeText}>前</Text>
            </View>
          )}
          {hasAfterRecord && (
            <View style={[styles.recordBadge, styles.afterBadge]}>
              <Text style={styles.badgeText}>後</Text>
            </View>
          )}
        </View>
      )}

      {/* 運行なし切り替えボタン */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggleNoOperation}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Feather 
          name={isNoOperation ? 'x' : 'minus'} 
          size={12} 
          color={colors.darkGray} 
        />
      </TouchableOpacity>
    </View>
  );
});

DayRecordCard.displayName = 'DayRecordCard';

const styles = StyleSheet.create({
  dayCard: {
    minHeight: 80,
    padding: 8,
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.beige,
    position: 'relative',
    justifyContent: 'space-between',
  },
  weekendCard: {
    borderColor: colors.orange,
    borderWidth: 1.5,
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
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 4,
  },
  todayNumber: {
    color: colors.charcoal,
    fontSize: 16,
  },
  sundayNumber: {
    color: colors.error,
  },
  saturdayNumber: {
    color: colors.orange,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  detailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    marginTop: 4,
  },
  recordBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  beforeBadge: {
    backgroundColor: colors.orange,
  },
  afterBadge: {
    backgroundColor: colors.charcoal,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.cream,
  },
  toggleButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.beige,
  },
});

export default DayRecordCard;