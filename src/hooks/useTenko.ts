import { useEffect, useMemo, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useTenkoStore } from '@/store/tenkoStore';
import { TenkoService } from '@/services/tenkoService';
import { WorkSessionDetail } from '@/types/database';

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

  // セッション状態管理
  const [sessionStatus, setSessionStatus] = useState<{
    hasActiveSession: boolean;
    hasCompletedSession: boolean;
    activeSession?: WorkSessionDetail;
    latestCompletedSession?: WorkSessionDetail;
    canStartNewSession: boolean;
  } | null>(null);

  // Debug logging for session status changes
  useEffect(() => {
    console.log('*** useTenko: Session status changed:', {
      sessionStatus,
      timestamp: new Date().toISOString()
    });
    
    if (sessionStatus?.activeSession) {
      console.log('*** useTenko: Active session details:', {
        sessionId: sessionStatus.activeSession.id,
        beforeCompleted: !!sessionStatus.activeSession.before_record,
        afterCompleted: !!sessionStatus.activeSession.after_record,
        beforeRecord: sessionStatus.activeSession.before_record,
        afterRecord: sessionStatus.activeSession.after_record,
        timestamp: new Date().toISOString()
      });
    }
    
    if (sessionStatus?.latestCompletedSession) {
      console.log('*** useTenko: Latest completed session details:', {
        sessionId: sessionStatus.latestCompletedSession.id,
        beforeCompleted: !!sessionStatus.latestCompletedSession.before_record,
        afterCompleted: !!sessionStatus.latestCompletedSession.after_record,
        beforeRecord: sessionStatus.latestCompletedSession.before_record,
        afterRecord: sessionStatus.latestCompletedSession.after_record,
        timestamp: new Date().toISOString()
      });
    }
  }, [sessionStatus]);

  // 初期データの取得
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 今日の点呼記録、車両一覧、セッション状況を並行取得
        const [todayRecords, vehicles, sessionStatusResult] = await Promise.all([
          TenkoService.getTodayRecords(user.id),
          TenkoService.getUserVehicles(user.id),
          TenkoService.getTodaySessionStatus(user.id),
        ]);

        setTodayRecords(todayRecords);
        setVehicles(vehicles);
        setSessionStatus(sessionStatusResult);
        
        console.log('*** useTenko: Initial data loaded:', {
          todayRecordsCount: todayRecords.length,
          vehiclesCount: vehicles.length,
          sessionStatusResult,
          timestamp: new Date().toISOString()
        });
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

  // 今日のステータス情報（業務セッション対応版）
  const todayStatus = useMemo(() => {
    // 日付が変わった場合の判定
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = (record: any) => {
      if (!record?.created_at) return false;
      const recordDate = new Date(record.created_at).toISOString().split('T')[0];
      return recordDate !== today;
    };
    
    // セッション情報がある場合はそれを優先
    if (sessionStatus) {
      const { activeSession, latestCompletedSession, canStartNewSession } = sessionStatus;
      
      // アクティブセッションがある場合
      if (activeSession) {
        // 記録ベースの情報も取得して補完
        const recordBasedAfterRecord = getTodayRecord('after');
        const recordBasedBeforeRecord = getTodayRecord('before');
        
        // 日付が変わった場合は、記録をリセット
        const beforeCompleted = isNewDay(recordBasedBeforeRecord) ? false : (!!activeSession.before_record || !!recordBasedBeforeRecord);
        const afterCompleted = isNewDay(recordBasedAfterRecord) ? false : (!!activeSession.after_record || !!recordBasedAfterRecord);
        const shouldShowNextBusinessButton = beforeCompleted && afterCompleted && canStartNewSession && !isNewDay(recordBasedBeforeRecord) && !isNewDay(recordBasedAfterRecord);
        
        const status = {
          beforeCompleted,
          afterCompleted,
          beforeRecord: isNewDay(recordBasedBeforeRecord) ? null : (activeSession.before_record || recordBasedBeforeRecord),
          afterRecord: isNewDay(recordBasedAfterRecord) ? null : (activeSession.after_record || recordBasedAfterRecord),
          defaultVehicle: getDefaultVehicle(),
          canStartNewSession: shouldShowNextBusinessButton ? canStartNewSession : false,
          activeSession,
          latestCompletedSession
        };
        
        console.log('*** useTenko: todayStatus computed (active session):', {
          status,
          sessionId: activeSession.id,
          sessionAfterRecord: activeSession.after_record,
          recordBasedAfterRecord,
          timestamp: new Date().toISOString()
        });
        
        return status;
      }
      
      // 完了したセッションのみがある場合（アクティブセッションなし）
      if (latestCompletedSession) {
        // 日付が変わった場合は、記録をリセット
        const beforeCompleted = isNewDay(latestCompletedSession.before_record) ? false : !!latestCompletedSession.before_record;
        const afterCompleted = isNewDay(latestCompletedSession.after_record) ? false : !!latestCompletedSession.after_record;
        const shouldShowNextBusinessButton = beforeCompleted && afterCompleted && canStartNewSession && !isNewDay(latestCompletedSession.before_record) && !isNewDay(latestCompletedSession.after_record);
        
        const status = {
          beforeCompleted,
          afterCompleted,
          beforeRecord: isNewDay(latestCompletedSession.before_record) ? null : latestCompletedSession.before_record,
          afterRecord: isNewDay(latestCompletedSession.after_record) ? null : latestCompletedSession.after_record,
          defaultVehicle: getDefaultVehicle(),
          canStartNewSession: shouldShowNextBusinessButton ? canStartNewSession : false,
          activeSession,
          latestCompletedSession
        };
        
        console.log('*** useTenko: todayStatus computed (completed session):', {
          status,
          sessionId: latestCompletedSession.id,
          timestamp: new Date().toISOString()
        });
        
        return status;
      }
    }
    
    // フォールバック: 従来の記録ベース
    const beforeRecord = getTodayRecord('before');
    const afterRecord = getTodayRecord('after');
    const beforeCompleted = isNewDay(beforeRecord) ? false : isCompleted('before');
    const afterCompleted = isNewDay(afterRecord) ? false : isCompleted('after');
    
    const status = {
      beforeCompleted,
      afterCompleted,
      beforeRecord: isNewDay(beforeRecord) ? null : beforeRecord,
      afterRecord: isNewDay(afterRecord) ? null : afterRecord,
      defaultVehicle: getDefaultVehicle(),
      canStartNewSession: false, // フォールバックでは新しいセッション開始ボタンは表示しない
      activeSession: undefined,
      latestCompletedSession: undefined
    };
    
    console.log('*** useTenko: todayStatus computed (fallback):', {
      status,
      timestamp: new Date().toISOString()
    });
    
    return status;
  }, [isCompleted, getTodayRecord, getDefaultVehicle, sessionStatus]);

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
      
      console.log('*** useTenko: refreshData called:', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      try {
        setLoading(true);
        const [todayRecords, vehicles, sessionStatusResult] = await Promise.all([
          TenkoService.getTodayRecords(user.id),
          TenkoService.getUserVehicles(user.id),
          TenkoService.getTodaySessionStatus(user.id),
        ]);
        setTodayRecords(todayRecords);
        setVehicles(vehicles);
        setSessionStatus(sessionStatusResult);
        
        console.log('*** useTenko: Data refreshed:', {
          todayRecordsCount: todayRecords.length,
          vehiclesCount: vehicles.length,
          sessionStatusResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('*** useTenko: refreshData error:', error);
        setError(error instanceof Error ? error.message : 'データの更新に失敗しました');
      } finally {
        setLoading(false);
      }
    }, [user, setLoading, setTodayRecords, setVehicles, setError]),
  };
}