import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { 
  generateCalendarDates, 
  isSameMonth, 
  isToday, 
  isSaturday, 
  isSunday,
  formatDateKey,
  getDayName
} from '@/utils/dateUtils';
import { TenkoRecord } from '@/types/database';

interface CalendarGridProps {
  year: number;
  month: number;
  records: TenkoRecord[];
  onDatePress?: (date: Date) => void;
}

interface DayStatus {
  beforeCompleted: boolean;
  afterCompleted: boolean;
  hasRecords: boolean;
}

export function CalendarGrid({ year, month, records, onDatePress }: CalendarGridProps) {
  const dates = generateCalendarDates(year, month);
  
  // 記録データをマップに変換（日付キー -> 記録配列）
  const recordsMap = React.useMemo(() => {
    const map = new Map<string, TenkoRecord[]>();
    records.forEach(record => {
      const dateKey = record.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(record);
    });
    return map;
  }, [records]);

  // 指定日の状態を取得
  const getDayStatus = (date: Date): DayStatus => {
    const dateKey = formatDateKey(date);
    const dayRecords = recordsMap.get(dateKey) || [];
    
    const beforeCompleted = dayRecords.some(r => r.type === 'before');
    const afterCompleted = dayRecords.some(r => r.type === 'after');
    
    return {
      beforeCompleted,
      afterCompleted,
      hasRecords: dayRecords.length > 0
    };
  };

  // 曜日ヘッダー
  const renderDayHeader = () => {
    const dayHeaders = [];
    for (let i = 0; i < 7; i++) {
      const dayName = getDayName(i);
      dayHeaders.push(
        <View key={i} style={styles.dayHeader}>
          <Text style={[
            styles.dayHeaderText,
            i === 0 && styles.sundayText,
            i === 6 && styles.saturdayText
          ]}>
            {dayName}
          </Text>
        </View>
      );
    }
    return <View style={styles.dayHeaderRow}>{dayHeaders}</View>;
  };

  // 日付セル
  const renderDateCell = (date: Date, index: number) => {
    const isCurrentMonth = isSameMonth(date, year, month);
    const isTodayDate = isToday(date);
    const isSat = isSaturday(date);
    const isSun = isSunday(date);
    const status = getDayStatus(date);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dateCell,
          isTodayDate && styles.todayCell,
          !isCurrentMonth && styles.otherMonthCell
        ]}
        onPress={() => onDatePress?.(date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateText,
          !isCurrentMonth && styles.otherMonthText,
          isTodayDate && styles.todayText,
          isSun && styles.sundayText,
          isSat && styles.saturdayText
        ]}>
          {date.getDate()}
        </Text>
        
        {/* 記録状態インジケーター */}
        {status.hasRecords && (
          <View style={styles.statusContainer}>
            {status.beforeCompleted && (
              <View style={[styles.statusDot, styles.beforeDot]} />
            )}
            {status.afterCompleted && (
              <View style={[styles.statusDot, styles.afterDot]} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderDayHeader()}
      <View style={styles.calendarGrid}>
        {dates.map((date, index) => renderDateCell(date, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
  },
  dayHeader: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%', // 100% / 7日
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    position: 'relative',
  },
  otherMonthCell: {
    backgroundColor: '#faf9f4', // 少し暗いクリーム色
  },
  todayCell: {
    backgroundColor: colors.orange,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.charcoal,
  },
  otherMonthText: {
    color: colors.beige,
  },
  todayText: {
    color: colors.cream,
    fontWeight: 'bold',
  },
  sundayText: {
    color: '#d32f2f', // 赤色
  },
  saturdayText: {
    color: '#1976d2', // 青色
  },
  statusContainer: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  beforeDot: {
    backgroundColor: colors.orange,
  },
  afterDot: {
    backgroundColor: colors.charcoal,
  },
});