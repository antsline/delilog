import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { TenkoRecord, NoOperationDay } from '@/types/database';
import { generateDayList, formatDateDisplay } from '@/utils/dateUtils';
import { NoOperationService } from '@/services/noOperationService';
import HelpButton from '@/components/common/HelpButton';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { withPerformanceMonitoring, usePerformanceMonitor } from '@/utils/performanceMonitor';
import { useOptimizedCallback } from '@/hooks/useOptimizedPerformance';
import { recordComponentOptimization } from '@/utils/performanceReporter';
import DayRecordCard from './DayRecordCard';
import RecordDetailModal from './RecordDetailModal';

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
  isHoliday: boolean;
  sessionCount: number;
  completedSessions: number;
  sessions: Array<{
    before?: TenkoRecord;
    after?: TenkoRecord;
    isComplete: boolean;
    timeRange?: string;
  }>;
}

function RecordListView({
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
  
  // 詳細モーダルの状態
  const [selectedDayRecord, setSelectedDayRecord] = React.useState<DayRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = React.useState(false);
  
  // パフォーマンス計測（改善版）
  const performanceMetrics = React.useRef({
    renderStart: performance.now(),
    mountTime: 0,
    updateCount: 0,
  });

  // 初回マウント時の計測
  React.useLayoutEffect(() => {
    const mountTime = performance.now() - performanceMetrics.current.renderStart;
    performanceMetrics.current.mountTime = mountTime;
    recordRenderTime('RecordListView_Mount', mountTime);
    checkMemoryUsage('RecordListView_Mount');
    
    // 最適化記録
    recordComponentOptimization('RecordListView');
  }, []);

  // 更新時の計測（依存配列変更時のみ）
  React.useEffect(() => {
    performanceMetrics.current.updateCount++;
    const updateStart = performance.now();
    
    return () => {
      const updateTime = performance.now() - updateStart;
      recordRenderTime('RecordListView_Update', updateTime);
      checkMemoryUsage('RecordListView_Update');
    };
  }, [year, month, records.length, noOperationDays.length]);
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return dayList.map(day => {
      const dayRecords = recordsMap.get(day.dateStr) || [];
      const hasAnyRecord = dayRecords.length > 0;
      const isExplicitNoOperation = noOperationMap.has(day.dateStr);
      
      // 日付を比較用に変換
      const dayDate = new Date(day.dateStr);
      const isPastDate = dayDate < yesterday;
      
      // 昨日以前で記録がない日は運行なしと判定
      const isNoOperation = isPastDate ? (!hasAnyRecord || isExplicitNoOperation) : isExplicitNoOperation;
      
      // セッション別にグループ化
      const sessionMap = new Map<string, { before?: TenkoRecord; after?: TenkoRecord }>();
      
      dayRecords.forEach(record => {
        const sessionKey = record.work_session_id || `${record.date}_${record.vehicle_id}`;
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, {});
        }
        const session = sessionMap.get(sessionKey)!;
        if (record.type === 'before') {
          session.before = record;
        } else {
          session.after = record;
        }
      });
      
      // セッション情報を作成
      const sessions = Array.from(sessionMap.values()).map(session => {
        const isComplete = !!session.before && !!session.after;
        let timeRange = '';
        
        if (session.before && session.after) {
          const beforeTime = new Date(session.before.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          const afterTime = new Date(session.after.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          timeRange = `${beforeTime}〜${afterTime}`;
        } else if (session.before) {
          const beforeTime = new Date(session.before.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          timeRange = `${beforeTime}〜`;
        } else if (session.after) {
          const afterTime = new Date(session.after.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          timeRange = `〜${afterTime}`;
        }
        
        return {
          before: session.before,
          after: session.after,
          isComplete,
          timeRange,
        };
      });
      
      // 時間順でソート
      sessions.sort((a, b) => {
        const aTime = a.before?.created_at || a.after?.created_at || '';
        const bTime = b.before?.created_at || b.after?.created_at || '';
        return aTime.localeCompare(bTime);
      });
      
      const sessionCount = sessions.length;
      const completedSessions = sessions.filter(s => s.isComplete).length;
      const hasBeforeRecord = sessions.some(s => s.before);
      const hasAfterRecord = sessions.some(s => s.after);
      const isComplete = sessionCount > 0 && completedSessions === sessionCount;
      
      return {
        date: day.dateStr,
        dayOfMonth: day.dayOfMonth,
        isToday: day.isToday,
        hasBeforeRecord,
        hasAfterRecord,
        isComplete,
        isNoOperation,
        isSaturday: day.isSaturday,
        isSunday: day.isSunday,
        isWeekend: day.isWeekend,
        isHoliday: day.isHoliday,
        sessionCount,
        completedSessions,
        sessions,
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

  // 詳細モーダルを開く
  const openDetailModal = (dayRecord: DayRecord) => {
    setSelectedDayRecord(dayRecord);
    setDetailModalVisible(true);
  };

  // 詳細モーダルを閉じる
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedDayRecord(null);
  };


  // 最適化された日記録カードラッパー
  const OptimizedDayRecordCard = React.memo(({ 
    dayRecord,
    onPress,
    onLongPress,
    onPDFExport
  }: {
    dayRecord: DayRecord;
    onPress: () => void;
    onLongPress: () => void;
    onPDFExport: () => void;
  }) => {
    return (
      <View style={styles.recordItemContainer}>
        <TouchableOpacity 
          style={styles.recordItemTouch}
          onPress={onPress}
          onLongPress={onLongPress}
        >
          <DayRecordCard
            date={dayRecord.date}
            dayOfMonth={dayRecord.dayOfMonth}
            isToday={dayRecord.isToday}
            hasBeforeRecord={dayRecord.hasBeforeRecord}
            hasAfterRecord={dayRecord.hasAfterRecord}
            isComplete={dayRecord.isComplete}
            isNoOperation={dayRecord.isNoOperation}
            isSaturday={dayRecord.isSaturday}
            isSunday={dayRecord.isSunday}
            isWeekend={dayRecord.isWeekend}
            isHoliday={dayRecord.isHoliday}
            sessionCount={dayRecord.sessionCount}
            completedSessions={dayRecord.completedSessions}
            sessions={dayRecord.sessions}
          />
          
          {/* PDF出力ボタン */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onPDFExport();
            }}
            style={styles.pdfButton}
          >
            <Feather name="file-text" size={16} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* ヘッダー部分 */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: colors.cream,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: colors.charcoal,
          }}>
            記録一覧
          </Text>
          <HelpButton
            type="specific"
            helpContent={{
              title: '記録一覧の見方',
              description: '月別の点呼記録の状況を確認できます。各日付のカードをタップして詳細を確認したり、PDFを生成できます。',
              steps: [
                '左右の矢印で月を切り替え',
                '各日付のカードで記録状況を確認',
                '✓: 完了、△: 部分記録、○: 未記録、−: 運行なし',
                'カードをタップして詳細確認',
                'PDFボタンで週次レポート生成',
                '長押しで運行なし切り替え（過去日のみ）'
              ]
            }}
            variant="icon"
            size="medium"
          />
        </View>
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
          <OptimizedDayRecordCard
            key={dayRecord.date}
            dayRecord={dayRecord}
            onPress={() => openDetailModal(dayRecord)}
            onLongPress={() => {
              // 詳細画面への遷移予定
              console.log('長押しされた日付:', dayRecord.date);
            }}
            onPDFExport={() => navigateToPDFExport(dayRecord)}
          />
        ))}
      </ScrollView>

      {/* 詳細モーダル */}
      {selectedDayRecord && (
        <RecordDetailModal
          visible={detailModalVisible}
          onClose={closeDetailModal}
          dayRecord={selectedDayRecord}
        />
      )}
    </View>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  recordItemContainer: {
    marginBottom: 8,
  },
  recordItemTouch: {
    position: 'relative',
  },
  pdfButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.orange,
    borderRadius: 6,
    padding: 6,
    zIndex: 1,
  },
});

// コンポーネント全体をメモ化してエクスポート
export default React.memo(withPerformanceMonitoring(RecordListView, 'RecordListView'));