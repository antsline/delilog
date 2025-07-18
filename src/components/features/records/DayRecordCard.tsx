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
  sessionCount: number;
  completedSessions: number;
  sessions: Array<{
    before?: any;
    after?: any;
    isComplete: boolean;
    timeRange?: string;
  }>;
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
  sessionCount,
  completedSessions,
  sessions,
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
    // 複数セッションの場合は高さを調整
    sessionCount > 1 && styles.multiSessionCard,
  ], [isToday, getRecordStatus.bgColor, sessionCount]);


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

        {/* 右側: 記録状態（フル幅使用） */}
        <View style={styles.statusSection}>
          {isNoOperation ? (
            <View style={styles.noOperationStatus}>
              <Feather name="minus-circle" size={16} color={colors.darkGray} />
              <Text style={styles.noOperationText}>運行なし</Text>
            </View>
          ) : (
            <View style={styles.recordStatusContainer}>
              {/* 点呼記録セクション */}
              <View style={styles.tenkoSection}>
                <Text style={styles.sectionTitle}>点呼記録</Text>
                {sessionCount > 1 ? (
                  <View style={styles.multiSessionContainer}>
                    {sessions.map((session, index) => (
                      <View key={index} style={styles.sessionRow}>
                        <View style={styles.recordItem}>
                          <Feather 
                            name={session.before ? 'check-circle' : 'circle'} 
                            size={12} 
                            color={session.before ? colors.success : colors.darkGray} 
                          />
                          <Text style={[styles.recordLabel, { 
                            color: session.before ? colors.success : colors.darkGray,
                            fontSize: 10
                          }]}>
                            前
                          </Text>
                        </View>
                        <View style={styles.recordItem}>
                          <Feather 
                            name={session.after ? 'check-circle' : 'circle'} 
                            size={12} 
                            color={session.after ? colors.success : colors.darkGray} 
                          />
                          <Text style={[styles.recordLabel, { 
                            color: session.after ? colors.success : colors.darkGray,
                            fontSize: 10
                          }]}>
                            後
                          </Text>
                        </View>
                        {session.timeRange && (
                          <Text style={styles.sessionTimeText}>{session.timeRange}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.singleSessionContainer}>
                    <View style={styles.recordRow}>
                      <View style={styles.recordItem}>
                        <Feather 
                          name={hasBeforeRecord ? 'check-circle' : 'circle'} 
                          size={12} 
                          color={hasBeforeRecord ? colors.success : colors.darkGray} 
                        />
                        <Text style={[styles.recordLabel, { 
                          color: hasBeforeRecord ? colors.success : colors.darkGray,
                          fontSize: 10
                        }]}>
                          業務前
                        </Text>
                      </View>
                      <View style={styles.recordItem}>
                        <Feather 
                          name={hasAfterRecord ? 'check-circle' : 'circle'} 
                          size={12} 
                          color={hasAfterRecord ? colors.success : colors.darkGray} 
                        />
                        <Text style={[styles.recordLabel, { 
                          color: hasAfterRecord ? colors.success : colors.darkGray,
                          fontSize: 10
                        }]}>
                          業務後
                        </Text>
                      </View>
                    </View>
                    {sessions[0]?.timeRange && (
                      <Text style={styles.singleSessionTimeText}>{sessions[0].timeRange}</Text>
                    )}
                  </View>
                )}
              </View>

              {/* 将来の機能プレースホルダー */}
              <View style={styles.futureSection}>
                <View style={styles.futureItem}>
                  <Text style={styles.futureLabel}>日常点検</Text>
                  <Feather name="circle" size={12} color={colors.darkGray} />
                </View>
                <View style={styles.futureItem}>
                  <Text style={styles.futureLabel}>運行記録</Text>
                  <Feather name="circle" size={12} color={colors.darkGray} />
                </View>
              </View>
            </View>
          )}
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
  multiSessionCard: {
    minHeight: 90,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  multiSessionContent: {
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  dateSection: {
    minWidth: 60,
    alignItems: 'flex-start',
    paddingRight: 8,
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
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  recordStatusContainer: {
    alignItems: 'flex-start',
    width: '100%',
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
  tenkoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  futureSection: {
    flexDirection: 'row',
    gap: 12,
  },
  futureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  futureLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.darkGray,
  },
  multiSessionContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  singleSessionContainer: {
    alignItems: 'flex-start',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    marginVertical: 2,
    paddingHorizontal: 0,
  },
  sessionTimeText: {
    fontSize: 9,
    color: colors.darkGray,
    marginLeft: 8,
    minWidth: 60,
  },
  singleSessionTimeText: {
    fontSize: 11,
    color: colors.darkGray,
    marginTop: 4,
    textAlign: 'left',
  },
});

export default DayRecordCard;