import { useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTenkoStore } from '@/store/tenkoStore';
import { TenkoService } from '@/services/tenkoService';

export function useTenko() {
  const { user } = useAuth();
  const {
    todayRecords,
    vehicles,
    loading,
    error,
    setTodayRecords,
    setVehicles,
    setLoading,
    setError,
    getTodayRecord,
    getDefaultVehicle,
    isCompleted,
  } = useTenkoStore();

  // 初期データの取得
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 今日の点呼記録と車両一覧を並行取得
        const [todayRecords, vehicles] = await Promise.all([
          TenkoService.getTodayRecords(user.id),
          TenkoService.getUserVehicles(user.id),
        ]);

        setTodayRecords(todayRecords);
        setVehicles(vehicles);
      } catch (error) {
        console.error('初期データ取得エラー:', error);
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.id, setLoading, setError, setTodayRecords, setVehicles]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!user) return;

    const subscription = TenkoService.subscribeToTenkoRecords(
      user.id,
      (records) => setTodayRecords(records)
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, setTodayRecords]);

  // 今日のステータス情報（メモ化で無限ループを防ぐ）
  const todayStatus = useMemo(() => ({
    beforeCompleted: isCompleted('before'),
    afterCompleted: isCompleted('after'),
    beforeRecord: getTodayRecord('before'),
    afterRecord: getTodayRecord('after'),
    defaultVehicle: getDefaultVehicle(),
  }), [isCompleted, getTodayRecord, getDefaultVehicle]);

  return {
    // データ
    todayRecords,
    vehicles,
    loading,
    error,
    
    // ステータス
    todayStatus,
    
    // ヘルパー関数
    getTodayRecord,
    getDefaultVehicle,
    isCompleted,
    
    // アクション（メモ化で無限ループを防ぐ）
    refreshData: useCallback(async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [todayRecords, vehicles] = await Promise.all([
          TenkoService.getTodayRecords(user.id),
          TenkoService.getUserVehicles(user.id),
        ]);
        setTodayRecords(todayRecords);
        setVehicles(vehicles);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'データの更新に失敗しました');
      } finally {
        setLoading(false);
      }
    }, [user, setLoading, setTodayRecords, setVehicles, setError]),
  };
}