import React from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { TenkoService } from '@/services/tenkoService';
import RecordListView from '@/components/features/records/RecordListView';
import { TenkoRecord, NoOperationDay } from '@/types/database';
import { colors } from '@/constants/colors';

export default function RecordsScreen() {
  const { user } = useAuthStore();
  const [records, setRecords] = React.useState<TenkoRecord[]>([]);
  const [noOperationDays, setNoOperationDays] = React.useState<NoOperationDay[]>([]);
  const [currentDate, setCurrentDate] = React.useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [loading, setLoading] = React.useState(false);

  // データ取得
  const fetchRecords = React.useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await TenkoService.getMonthlyRecordsWithNoOperation(
        user.id, 
        currentDate.year, 
        currentDate.month
      );
      setRecords(data.records);
      setNoOperationDays(data.noOperationDays);
    } catch (error) {
      console.error('記録取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate]);

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
      <RecordListView
        year={currentDate.year}
        month={currentDate.month}
        records={records}
        noOperationDays={noOperationDays}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDataChanged={fetchRecords}
      />
    </SafeAreaView>
  );
}