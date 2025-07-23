import React from 'react';
import { View, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { TenkoService } from '@/services/tenkoService';
import HelpButton from '@/components/common/HelpButton';
import RecordListView from '@/components/features/records/RecordListView';
import { TenkoRecord, NoOperationDay } from '@/types/database';
import { colors } from '@/constants/colors';
import { useOfflineStore, useLocalTenkoRecords, useDataStats, useIsOffline } from '@/store/offlineStore';
import { getJapanDate } from '@/utils/dateUtils';
import { Feather } from '@expo/vector-icons';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

export default function RecordsScreen() {
  const { user } = useAuthStore();
  const [records, setRecords] = React.useState<TenkoRecord[]>([]);
  const [noOperationDays, setNoOperationDays] = React.useState<NoOperationDay[]>([]);
  const [currentDate, setCurrentDate] = React.useState(() => {
    const now = getJapanDate();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [loading, setLoading] = React.useState(false);
  
  // オフライン機能
  const offlineStore = useOfflineStore();
  const localTenkoRecords = useLocalTenkoRecords();
  const dataStats = useDataStats();
  const isOffline = useIsOffline();

  // データ取得（オンライン・オフライン統合）
  const fetchRecords = React.useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let serverRecords: TenkoRecord[] = [];
      let noOpDays: NoOperationDay[] = [];
      
      // オンライン時はサーバーからも取得
      if (!isOffline) {
        try {
          const data = await TenkoService.getMonthlyRecordsWithNoOperation(
            user.id, 
            currentDate.year, 
            currentDate.month
          );
          serverRecords = data.records;
          noOpDays = data.noOperationDays;
        } catch (error) {
          console.log('サーバー記録取得失敗、ローカル記録のみ表示:', error);
        }
      }
      
      // ローカル記録を現在の年月でフィルタリング
      const currentMonthStart = new Date(currentDate.year, currentDate.month, 1);
      const currentMonthEnd = new Date(currentDate.year, currentDate.month + 1, 0);
      
      const filteredLocalRecords = localTenkoRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= currentMonthStart && recordDate <= currentMonthEnd;
      });
      
      // ローカル記録をTenkoRecord形式に変換
      const convertedLocalRecords: TenkoRecord[] = filteredLocalRecords.map(localRecord => ({
        id: localRecord.server_id || localRecord.local_id,
        user_id: localRecord.user_id,
        vehicle_id: localRecord.vehicle_id,
        date: localRecord.date,
        type: localRecord.type,
        check_method: localRecord.check_method,
        executor: localRecord.executor,
        alcohol_detector_used: localRecord.alcohol_detector_used || true,
        alcohol_detected: localRecord.alcohol_detected || false,
        alcohol_level: localRecord.alcohol_level,
        health_status: localRecord.health_status,
        daily_check_completed: localRecord.daily_check_completed,
        operation_status: localRecord.operation_status,
        notes: localRecord.notes,
        platform: localRecord.platform,
        is_offline_created: localRecord.is_offline_created,
        created_at: localRecord.created_at_local,
        updated_at: localRecord.updated_at_local,
        // オフライン記録の識別用フラグを追加
        _isOfflineRecord: !localRecord.is_synced,
        _localId: localRecord.local_id,
      } as TenkoRecord & { _isOfflineRecord: boolean; _localId: string }));
      
      // サーバー記録と統合（重複除去）
      const allRecords = [...serverRecords];
      
      // ローカル記録のうち、サーバーに存在しないものを追加
      convertedLocalRecords.forEach(localRecord => {
        const existsOnServer = serverRecords.some(serverRecord => 
          serverRecord.date === localRecord.date && 
          serverRecord.type === localRecord.type &&
          serverRecord.vehicle_id === localRecord.vehicle_id
        );
        
        if (!existsOnServer) {
          allRecords.push(localRecord);
        }
      });
      
      // 日付でソート
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecords(allRecords);
      setNoOperationDays(noOpDays);
      
    } catch (error) {
      console.error('記録取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, isOffline, localTenkoRecords]);

  // 初回データ取得
  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 月移動ハンドラー
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      {/* 同期状態表示 */}
      <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        <SyncStatusIndicator showDetails={true} />
      </View>
      
      <RecordListView
        year={currentDate.year}
        month={currentDate.month + 1}
        records={records}
        noOperationDays={noOperationDays}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDataChanged={fetchRecords}
      />
    </SafeAreaView>
  );
}