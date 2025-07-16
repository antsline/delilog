/**
 * 記録詳細モーダルコンポーネント
 * 日付カードをタップした時の詳細情報を表示
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

interface RecordDetailModalProps {
  visible: boolean;
  onClose: () => void;
  dayRecord: {
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
  };
}

export default function RecordDetailModal({
  visible,
  onClose,
  dayRecord,
}: RecordDetailModalProps) {
  const [vehicleNumbers, setVehicleNumbers] = React.useState<{ [key: string]: string }>({});

  // 車両番号を取得
  React.useEffect(() => {
    const fetchVehicleNumbers = async () => {
      if (!visible || !dayRecord.sessions.length) return;

      const vehicleIds = new Set<string>();
      dayRecord.sessions.forEach(session => {
        if (session.before?.vehicle_id) vehicleIds.add(session.before.vehicle_id);
        if (session.after?.vehicle_id) vehicleIds.add(session.after.vehicle_id);
      });

      if (vehicleIds.size === 0) return;

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, plate_number')
        .in('id', Array.from(vehicleIds));

      if (vehicles) {
        const vehicleMap: { [key: string]: string } = {};
        vehicles.forEach(v => {
          vehicleMap[v.id] = v.plate_number;
        });
        setVehicleNumbers(vehicleMap);
      }
    };

    fetchVehicleNumbers();
  }, [visible, dayRecord]);

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 時間フォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 曜日の色を決定
  const getDayColor = () => {
    if (dayRecord.isSunday || dayRecord.isHoliday) return colors.error;
    if (dayRecord.isSaturday) return colors.saturday;
    return colors.charcoal;
  };

  // 完了状態のアイコンとテキスト
  const getCompletionStatus = () => {
    if (dayRecord.isNoOperation) {
      return {
        icon: 'minus-circle',
        color: colors.darkGray,
        text: '運行なし',
      };
    }
    
    if (dayRecord.isComplete) {
      return {
        icon: 'check-circle',
        color: colors.success,
        text: '完了',
      };
    }
    
    if (dayRecord.hasBeforeRecord || dayRecord.hasAfterRecord) {
      return {
        icon: 'alert-circle',
        color: colors.orange,
        text: '一部完了',
      };
    }
    
    return {
      icon: 'circle',
      color: colors.darkGray,
      text: '未記録',
    };
  };

  const completionStatus = getCompletionStatus();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: getDayColor() }]}>
              {formatDate(dayRecord.date)}
            </Text>
            <View style={styles.statusContainer}>
              <Feather 
                name={completionStatus.icon as any}
                size={20}
                color={completionStatus.color}
              />
              <Text style={[styles.statusText, { color: completionStatus.color }]}>
                {completionStatus.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 運行なしの場合 */}
          {dayRecord.isNoOperation && (
            <View style={styles.noOperationCard}>
              <Feather name="minus-circle" size={40} color={colors.darkGray} />
              <Text style={styles.noOperationTitle}>運行なし</Text>
              <Text style={styles.noOperationDescription}>
                この日は運行業務がありませんでした
              </Text>
            </View>
          )}

          {/* 通常の記録がある場合 */}
          {!dayRecord.isNoOperation && (
            <>
              {/* 運行記録 */}
              {dayRecord.sessions.length > 0 ? (
                dayRecord.sessions.map((session, index) => {
                  const vehicleId = session.before?.vehicle_id || session.after?.vehicle_id;
                  const vehicleNumber = vehicleId ? vehicleNumbers[vehicleId] || '取得中...' : '未記録';
                  
                  return (
                    <View key={index} style={styles.sessionCard}>
                      {/* カードヘッダー */}
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionTitle}>
                          {dayRecord.sessionCount > 1 ? `${index + 1}回目の運行` : '運行記録'}
                        </Text>
                        <View style={styles.sessionBadge}>
                          <Feather
                            name={session.isComplete ? 'check-circle' : 'alert-circle'}
                            size={16}
                            color={session.isComplete ? colors.success : colors.orange}
                          />
                          <Text style={[
                            styles.sessionBadgeText,
                            { color: session.isComplete ? colors.success : colors.orange }
                          ]}>
                            {session.isComplete ? '完了' : '未完了'}
                          </Text>
                        </View>
                      </View>

                      {/* 車両情報 */}
                      <View style={styles.vehicleSection}>
                        <Feather name="truck" size={16} color={colors.darkGray} />
                        <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
                        {session.timeRange && (
                          <Text style={styles.timeRange}>{session.timeRange}</Text>
                        )}
                      </View>

                      {/* 点呼記録セクション */}
                      <View style={styles.recordSection}>
                        <Text style={styles.sectionTitle}>点呼記録</Text>
                        <View style={styles.recordGrid}>
                          {/* 業務前点呼 */}
                          <View style={styles.recordItem}>
                            <View style={styles.recordHeader}>
                              <Feather
                                name={session.before ? 'check-circle' : 'circle'}
                                size={16}
                                color={session.before ? colors.success : colors.darkGray}
                              />
                              <Text style={styles.recordLabel}>業務前点呼</Text>
                            </View>
                            <Text style={[
                              styles.recordStatus,
                              { color: session.before ? colors.success : colors.darkGray }
                            ]}>
                              {session.before 
                                ? formatTime(session.before.created_at)
                                : '未実施'
                              }
                            </Text>
                          </View>

                          {/* 業務後点呼 */}
                          <View style={styles.recordItem}>
                            <View style={styles.recordHeader}>
                              <Feather
                                name={session.after ? 'check-circle' : 'circle'}
                                size={16}
                                color={session.after ? colors.success : colors.darkGray}
                              />
                              <Text style={styles.recordLabel}>業務後点呼</Text>
                            </View>
                            <Text style={[
                              styles.recordStatus,
                              { color: session.after ? colors.success : colors.darkGray }
                            ]}>
                              {session.after 
                                ? formatTime(session.after.created_at)
                                : '未実施'
                              }
                            </Text>
                          </View>

                          {/* 日常点検（今後実装） */}
                          <View style={styles.recordItem}>
                            <View style={styles.recordHeader}>
                              <Feather
                                name="circle"
                                size={16}
                                color={colors.beige}
                              />
                              <Text style={[styles.recordLabel, { color: colors.beige }]}>
                                日常点検
                              </Text>
                            </View>
                            <Text style={[styles.recordStatus, { color: colors.beige }]}>
                              未実装
                            </Text>
                          </View>

                          {/* 運行記録（今後実装） */}
                          <View style={styles.recordItem}>
                            <View style={styles.recordHeader}>
                              <Feather
                                name="circle"
                                size={16}
                                color={colors.beige}
                              />
                              <Text style={[styles.recordLabel, { color: colors.beige }]}>
                                運行記録
                              </Text>
                            </View>
                            <Text style={[styles.recordStatus, { color: colors.beige }]}>
                              未実装
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 運行詳細（今後実装予定） */}
                      <View style={styles.futureSection}>
                        <Text style={styles.futureSectionTitle}>運行詳細（今後実装予定）</Text>
                        <View style={styles.futureGrid}>
                          <View style={styles.futureItem}>
                            <Text style={styles.futureLabel}>稼働時間</Text>
                            <Text style={styles.futureValue}>--:--</Text>
                          </View>
                          <View style={styles.futureItem}>
                            <Text style={styles.futureLabel}>休憩時間</Text>
                            <Text style={styles.futureValue}>--:--</Text>
                          </View>
                          <View style={styles.futureItem}>
                            <Text style={styles.futureLabel}>走行距離</Text>
                            <Text style={styles.futureValue}>-- km</Text>
                          </View>
                          <View style={styles.futureItem}>
                            <Text style={styles.futureLabel}>日常点検</Text>
                            <Text style={styles.futureValue}>--</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.noRecordsCard}>
                  <Feather name="file-text" size={40} color={colors.darkGray} />
                  <Text style={styles.noRecordsTitle}>記録なし</Text>
                  <Text style={styles.noRecordsDescription}>
                    この日はまだ点呼記録がありません
                  </Text>
                </View>
              )}

            </>
          )}
        </ScrollView>

        {/* フッター */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.container,
    paddingTop: spacing.container,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.container,
  },
  noOperationCard: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: spacing.container,
    alignItems: 'center',
    marginVertical: spacing.container,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  noOperationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noOperationDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.container,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
    marginBottom: spacing.md,
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    flex: 1,
  },
  timeRange: {
    fontSize: 14,
    color: colors.darkGray,
  },
  recordSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  recordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recordItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cream,
    padding: spacing.sm,
    borderRadius: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  recordStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 20,
  },
  futureSection: {
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.beige,
    borderStyle: 'dashed',
  },
  futureSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  futureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  futureItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  futureLabel: {
    fontSize: 11,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  futureValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.beige,
  },
  noRecordsCard: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: spacing.container,
    alignItems: 'center',
    marginVertical: spacing.container,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  noRecordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noRecordsDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.container,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  closeButtonLarge: {
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
});