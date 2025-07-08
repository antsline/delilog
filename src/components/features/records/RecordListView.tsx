import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { TenkoRecord, NoOperationDay } from '@/types/database';
import { generateDayList, formatDateDisplay } from '@/utils/dateUtils';
import { NoOperationService } from '@/services/noOperationService';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { withPerformanceMonitoring, usePerformanceMonitor } from '@/utils/performanceMonitor';

interface RecordListViewProps {
  year: number;
  month: number;
  records: TenkoRecord[];
  noOperationDays: NoOperationDay[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDataChanged: () => void;
}

interface DayRecord {
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
}

export default function RecordListView({
  year,
  month,
  records,
  noOperationDays,
  onPrevMonth,
  onNextMonth,
  onDataChanged,
}: RecordListViewProps) {
  const { user } = useAuthStore();
  const { checkMemoryUsage, recordRenderTime } = usePerformanceMonitor();
  
  // レンダリング時間計測
  const renderStartTime = React.useRef<number>();
  React.useEffect(() => {
    renderStartTime.current = Date.now();
  }, []);
  
  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = Date.now() - renderStartTime.current;
      recordRenderTime('RecordListView', renderTime);
    }
    checkMemoryUsage('RecordListView');
  });
  // 月の日数リストを生成
  const dayList = generateDayList(year, month);
  
  // 記録データをマップ化
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

  // 運行なし日をマップ化
  const noOperationMap = React.useMemo(() => {
    const map = new Set<string>();
    noOperationDays.forEach(day => {
      map.add(day.date);
    });
    return map;
  }, [noOperationDays]);

  // 各日の記録状態を計算
  const dayRecordsList: DayRecord[] = React.useMemo(() => {
    return dayList.map(day => {
      const dayRecords = recordsMap.get(day.dateStr) || [];
      const beforeRecord = dayRecords.find(r => r.type === 'before');
      const afterRecord = dayRecords.find(r => r.type === 'after');
      const isNoOperation = noOperationMap.has(day.dateStr);
      
      return {
        date: day.dateStr,
        dayOfMonth: day.dayOfMonth,
        isToday: day.isToday,
        hasBeforeRecord: !!beforeRecord,
        hasAfterRecord: !!afterRecord,
        isComplete: !!beforeRecord && !!afterRecord,
        isNoOperation,
        isSaturday: day.isSaturday,
        isSunday: day.isSunday,
        isWeekend: day.isWeekend,
      };
    });
    // 日付の昇順でソート（1日から順番に）
    return dayRecordsList;
  }, [dayList, recordsMap, noOperationMap]);

  // ステータスアイコンコンポーネント
  const StatusIcon = ({ dayRecord }: { dayRecord: DayRecord }) => {
    const getIconProps = () => {
      if (dayRecord.isNoOperation) {
        return {
          name: 'minus-circle' as const,
          color: '#9ca3af',
          size: 20,
        };
      } else if (dayRecord.isComplete) {
        return {
          name: 'check-circle' as const,
          color: '#22c55e',
          size: 20,
        };
      } else if (dayRecord.hasBeforeRecord || dayRecord.hasAfterRecord) {
        return {
          name: 'alert-circle' as const,
          color: '#f59e0b',
          size: 20,
        };
      } else {
        return {
          name: 'circle' as const,
          color: '#ef4444',
          size: 20,
        };
      }
    };

    const iconProps = getIconProps();

    return (
      <View style={{ marginRight: 8 }}>
        <Feather 
          name={iconProps.name}
          size={iconProps.size}
          color={iconProps.color}
        />
      </View>
    );
  };

  // PDF出力ページへの遷移
  const navigateToPDFExport = (dayRecord: DayRecord) => {
    const dateObj = new Date(dayRecord.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // PDF出力ページに遷移（パラメータ付き）
    router.push({
      pathname: '/(tabs)/pdf-export',
      params: {
        year: year.toString(),
        month: month.toString(), 
        day: day.toString(),
        type: 'tenko'
      }
    });
  };

  // 運行なし状態の切り替え
  const toggleNoOperation = async (date: string) => {
    if (!user) return;
    
    try {
      const isCurrentlyNoOperation = noOperationMap.has(date);
      const message = isCurrentlyNoOperation 
        ? `${date}を運行ありに変更しますか？`
        : `${date}を運行なしに設定しますか？`;
        
      Alert.alert(
        '運行状態の変更',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'OK',
            onPress: async () => {
              await NoOperationService.toggleNoOperationDay(user.id, date);
              onDataChanged();
            }
          }
        ]
      );
    } catch (error) {
      console.error('運行なし状態の切り替えに失敗:', error);
      Alert.alert('エラー', '設定の変更に失敗しました');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* ヘッダー部分 */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: colors.cream,
      }}>
        <Text style={{ 
          fontSize: 28, 
          fontWeight: 'bold', 
          color: colors.charcoal,
          marginBottom: 8,
        }}>
          記録一覧
        </Text>
      </View>

      {/* 年月ナビゲーション */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: colors.cream,
      }}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={{
            padding: 8,
          }}
        >
          <Text style={{ fontSize: 20, color: colors.charcoal }}>←</Text>
        </TouchableOpacity>
        
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: colors.charcoal 
        }}>
          {formatDateDisplay(year, month)}
        </Text>
        
        <TouchableOpacity
          onPress={onNextMonth}
          style={{
            padding: 8,
          }}
        >
          <Text style={{ fontSize: 20, color: colors.charcoal }}>→</Text>
        </TouchableOpacity>
      </View>


      {/* 記録一覧 */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {dayRecordsList.map((dayRecord) => (
          <TouchableOpacity
            key={dayRecord.date}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: '#fff',
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: dayRecord.isToday ? 2 : 1,
              borderColor: dayRecord.isToday ? '#000' : '#e1e5e9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => {
              // 詳細画面への遷移予定
              console.log('タップされた日付:', dayRecord.date);
            }}
            onLongPress={() => {
              // 長押しで運行なし切り替え
              console.log('長押しされた日付:', dayRecord.date);
              toggleNoOperation(dayRecord.date);
            }}
          >
            {/* 日付表示 */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: dayRecord.isSunday ? '#ff4444' :
                       dayRecord.isSaturday ? '#4444ff' : '#333',
              }}>
                {dayRecord.dayOfMonth}日
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#666',
                marginTop: 2,
              }}>
                {dayRecord.date}
              </Text>
            </View>

            {/* ステータス表示 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 8,
            }}>
              <StatusIcon dayRecord={dayRecord} />
              <Text style={{
                fontSize: 12,
                color: '#666',
              }}>
                {dayRecord.isNoOperation ? '運行なし' :
                 dayRecord.isComplete ? '完了' : 
                 dayRecord.hasBeforeRecord || dayRecord.hasAfterRecord ? '一部' : '未記録'}
              </Text>
            </View>

            {/* PDF出力ボタン */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation(); // 親のタップイベントを無効化
                navigateToPDFExport(dayRecord);
              }}
              style={{
                backgroundColor: colors.orange,
                borderRadius: 6,
                padding: 6,
                marginRight: 8,
              }}
            >
              <Feather name="file-text" size={16} color="#fff" />
            </TouchableOpacity>

            {/* 詳細矢印 */}
            <Text style={{ fontSize: 16, color: '#999' }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}