import { supabase } from './supabase';
import { TenkoRecord, TenkoRecordInsert, Vehicle, NoOperationDay, WorkSession, WorkSessionDetail } from '@/types/database';
import { randomUUID } from 'expo-crypto';

export class TenkoService {
  // 今日の点呼記録を取得（業務セッション対応版）
  static async getTodayRecords(userId: string): Promise<TenkoRecord[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    // 今日の業務に関連する記録を取得
    // 1. 今日作成された記録 (date = today)
    // 2. 今日を業務基準日とする記録 (work_date = today)
    const { data, error } = await supabase
      .from('tenko_records')
      .select('*')
      .eq('user_id', userId)
      .or(`date.eq.${today},work_date.eq.${today}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 点呼記録を作成（業務セッション対応版）
  static async createTenkoRecord(record: TenkoRecordInsert): Promise<TenkoRecord> {
    // 業務前点呼の場合は新しいセッションを開始
    if (record.type === 'before') {
      const workSessionId = randomUUID();
      const workDate = record.date; // 業務開始日を基準日とする
      
      // work_session_idとwork_dateカラムが存在するかチェック
      try {
        const recordWithSession = {
          ...record,
          work_session_id: workSessionId,
          work_date: workDate
        };

        const { data, error } = await supabase
          .from('tenko_records')
          .insert(recordWithSession)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        // work_session_idカラムが存在しない場合は従来の方式で作成
        console.log('work_session_id カラムが存在しないため、従来の方式で作成します');
        const { data, error: fallbackError } = await supabase
          .from('tenko_records')
          .insert(record)
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        return data;
      }
    }
    
    // 業務後点呼の場合は対応する業務前点呼のセッションを検索
    if (record.type === 'after') {
      try {
        // 既に業務後点呼が存在するかチェック
        const existingAfterRecord = await supabase
          .from('tenko_records')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('vehicle_id', record.vehicle_id)
          .eq('type', 'after')
          .eq('date', record.date)
          .single();

        if (existingAfterRecord.data) {
          throw new Error('本日の業務後点呼は既に記録されています。');
        }

        const activeSession = await this.getActiveWorkSession(record.user_id, record.vehicle_id);
        
        if (!activeSession) {
          throw new Error('対応する業務前点呼が見つかりません。先に業務前点呼を完了してください。');
        }

        const recordWithSession = {
          ...record,
          work_session_id: activeSession.work_session_id,
          work_date: activeSession.work_date
        };

        const { data, error } = await supabase
          .from('tenko_records')
          .insert(recordWithSession)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        // work_sessionsビューが存在しない場合は従来の方式
        console.log('work_sessions ビューが存在しないため、従来の方式で作成します');
        
        // 今日の業務前点呼を検索（複数セッションに対応）
        const { data: beforeRecords, error: beforeError } = await supabase
          .from('tenko_records')
          .select('*')
          .eq('user_id', record.user_id)
          .eq('vehicle_id', record.vehicle_id)
          .eq('type', 'before')
          .eq('date', record.date)
          .order('created_at', { ascending: false });

        if (beforeError) {
          console.error('業務前点呼検索エラー:', beforeError);
          throw new Error('業務前点呼が見つかりません。先に業務前点呼を完了してください。');
        }

        if (!beforeRecords || beforeRecords.length === 0) {
          throw new Error('業務前点呼が見つかりません。先に業務前点呼を完了してください。');
        }

        // 対応する業務後点呼がない業務前点呼を探す
        let targetBeforeRecord = null;
        for (const beforeRecord of beforeRecords) {
          const { data: existingAfterRecord } = await supabase
            .from('tenko_records')
            .select('id')
            .eq('user_id', record.user_id)
            .eq('vehicle_id', record.vehicle_id)
            .eq('type', 'after')
            .eq('date', record.date)
            .eq('work_session_id', beforeRecord.work_session_id)
            .single();

          if (!existingAfterRecord) {
            targetBeforeRecord = beforeRecord;
            break;
          }
        }

        if (!targetBeforeRecord) {
          throw new Error('対応する業務前点呼が見つかりません。先に業務前点呼を完了してください。');
        }

        console.log('対応する業務前点呼発見:', targetBeforeRecord.work_session_id);

        // 業務後点呼を作成（work_session_idを設定）
        const recordWithSession = {
          ...record,
          work_session_id: targetBeforeRecord.work_session_id,
          work_date: targetBeforeRecord.work_date || targetBeforeRecord.date
        };

        const { data, error: fallbackError } = await supabase
          .from('tenko_records')
          .insert(recordWithSession)
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        console.log('業務後点呼作成成功（フォールバック）:', data.work_session_id);
        return data;
      }
    }

    // 従来の方式（後方互換性）
    const { data, error } = await supabase
      .from('tenko_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 点呼記録を更新
  static async updateTenkoRecord(id: string, updates: Partial<TenkoRecordInsert>): Promise<TenkoRecord> {
    const { data, error } = await supabase
      .from('tenko_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // IDで点呼記録を取得
  static async getTenkoRecordById(id: string): Promise<TenkoRecord | null> {
    const { data, error } = await supabase
      .from('tenko_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 404以外はエラー
    return data || null;
  }

  // 点呼記録を削除
  static async deleteTenkoRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenko_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 指定期間の点呼記録を取得（業務セッション対応版）
  static async getRecordsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TenkoRecord[]> {
    // 指定期間に関連する記録を取得
    // 1. 記録作成日が期間内 (date between startDate and endDate)
    // 2. 業務基準日が期間内 (work_date between startDate and endDate)
    const { data, error } = await supabase
      .from('tenko_records')
      .select('*')
      .eq('user_id', userId)
      .or(`and(date.gte.${startDate},date.lte.${endDate}),and(work_date.gte.${startDate},work_date.lte.${endDate})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // 指定月の点呼記録を取得
  static async getRecordsByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<TenkoRecord[]> {
    // 月の最初と最後の日付を計算
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return this.getRecordsByDateRange(userId, startDate, endDate);
  }

  // 業務セッション関連メソッド

  // アクティブな業務セッションを取得
  static async getActiveWorkSession(userId: string, vehicleId: string): Promise<WorkSession | null> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)
        .eq('session_status', 'in_progress')
        .order('session_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.log('work_sessions ビューでエラー、フォールバック処理を実行:', error);
      
      // フォールバック: 今日の業務前点呼で対応する業務後点呼がないものを検索
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const { data: beforeRecords, error: beforeError } = await supabase
          .from('tenko_records')
          .select('*')
          .eq('user_id', userId)
          .eq('vehicle_id', vehicleId)
          .eq('type', 'before')
          .eq('date', today)
          .order('created_at', { ascending: false });

        if (beforeError) throw beforeError;
        if (!beforeRecords || beforeRecords.length === 0) {
          console.log('今日の業務前点呼が見つかりません');
          return null;
        }

        // 最新の業務前点呼に対応する業務後点呼があるかチェック
        for (const beforeRecord of beforeRecords) {
          const { data: afterRecord, error: afterError } = await supabase
            .from('tenko_records')
            .select('id')
            .eq('user_id', userId)
            .eq('vehicle_id', vehicleId)
            .eq('type', 'after')
            .eq('date', today)
            .eq('work_session_id', beforeRecord.work_session_id)
            .single();

          if (afterError && afterError.code !== 'PGRST116') {
            console.log('業務後点呼検索エラー:', afterError);
            continue;
          }

          if (!afterRecord) {
            // 対応する業務後点呼がない場合、このセッションはアクティブ
            console.log('アクティブセッション発見:', beforeRecord.work_session_id);
            return {
              work_session_id: beforeRecord.work_session_id,
              user_id: beforeRecord.user_id,
              vehicle_id: beforeRecord.vehicle_id,
              work_date: beforeRecord.work_date || beforeRecord.date,
              session_start: beforeRecord.created_at,
              session_end: null,
              before_count: 1,
              after_count: 0,
              total_records: 1,
              session_status: 'in_progress'
            };
          }
        }

        console.log('アクティブセッションが見つかりません');
        return null;
      } catch (fallbackError) {
        console.error('フォールバック処理でもエラー:', fallbackError);
        return null;
      }
    }
  }

  // 業務セッション詳細を取得
  static async getWorkSessionDetail(workSessionId: string): Promise<WorkSessionDetail | null> {
    try {
      // 業務セッション基本情報を取得
      const { data: session, error: sessionError } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('work_session_id', workSessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session) return null;

      // 点呼記録を取得
      const { data: records, error: recordsError } = await supabase
        .from('tenko_records')
        .select('*')
        .eq('work_session_id', workSessionId)
        .order('created_at');

      if (recordsError) throw recordsError;

      // 車両情報を取得
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', session.vehicle_id)
        .single();

      if (vehicleError) throw vehicleError;

      // レスポンスを構築
      const beforeRecord = records?.find(r => r.type === 'before');
      const afterRecord = records?.find(r => r.type === 'after');

      return {
        ...session,
        before_record: beforeRecord,
        after_record: afterRecord,
        vehicle: vehicle
      };
    } catch (error) {
      console.log('work_sessions ビューが存在しないため、従来の方式で検索します');
      return null;
    }
  }

  // 今日のアクティブセッションを取得（ホーム画面用）
  static async getTodayActiveSession(userId: string): Promise<WorkSessionDetail | null> {
    try {
      // 今日開始された未完了セッションを検索
      const today = new Date().toISOString().split('T')[0];
      
      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_status', 'in_progress')
        .gte('work_date', today)
        .order('session_start', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!sessions || sessions.length === 0) return null;

      return this.getWorkSessionDetail(sessions[0].work_session_id);
    } catch (error) {
      console.log('work_sessions ビューが存在しないため、従来の方式で検索します');
      
      // 今日の業務前点呼で対応する業務後点呼がないものを検索
      const today = new Date().toISOString().split('T')[0];
      
      const { data: beforeRecords, error: beforeError } = await supabase
        .from('tenko_records')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'before')
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (beforeError) throw beforeError;
      if (!beforeRecords || beforeRecords.length === 0) return null;

      // 対応する業務後点呼がない業務前点呼を探す
      for (const beforeRecord of beforeRecords) {
        const { data: afterRecord } = await supabase
          .from('tenko_records')
          .select('*')
          .eq('user_id', userId)
          .eq('vehicle_id', beforeRecord.vehicle_id)
          .eq('type', 'after')
          .eq('date', today)
          .single();

        if (!afterRecord) {
          // 対応する業務後点呼がない場合はアクティブセッション
          return {
            work_session_id: beforeRecord.work_session_id || beforeRecord.id,
            user_id: beforeRecord.user_id,
            vehicle_id: beforeRecord.vehicle_id,
            work_date: beforeRecord.work_date || beforeRecord.date,
            session_start: beforeRecord.created_at,
            session_end: null,
            before_count: 1,
            after_count: 0,
            total_records: 1,
            session_status: 'in_progress' as const,
            before_record: beforeRecord,
            after_record: undefined,
            vehicle: undefined
          };
        }
      }

      return null;
    }
  }

  // 今日の業務セッション状況を取得（ホーム画面用）
  static async getTodaySessionStatus(userId: string): Promise<{
    hasActiveSession: boolean;
    hasCompletedSession: boolean;
    activeSession?: WorkSessionDetail;
    latestCompletedSession?: WorkSessionDetail;
    canStartNewSession: boolean;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 今日のセッション一覧を取得
      const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('work_date', today)
        .order('session_start', { ascending: false });

      if (error) throw error;
      
      const activeSessions = sessions?.filter(s => s.session_status === 'in_progress') || [];
      const completedSessions = sessions?.filter(s => s.session_status === 'completed') || [];
      
      const hasActiveSession = activeSessions.length > 0;
      const hasCompletedSession = completedSessions.length > 0;
      
      // アクティブセッション（業務前は完了、業務後は未完了）
      const activeSession = hasActiveSession ? await this.getWorkSessionDetail(activeSessions[0].work_session_id) : undefined;
      
      // 最新の完了セッション
      const latestCompletedSession = hasCompletedSession ? await this.getWorkSessionDetail(completedSessions[0].work_session_id) : undefined;
      
      // 新しいセッションを開始できるかどうか
      const canStartNewSession = !hasActiveSession;
      
      return {
        hasActiveSession,
        hasCompletedSession,
        activeSession,
        latestCompletedSession,
        canStartNewSession
      };
    } catch (error) {
      console.log('work_sessions ビューが存在しないため、従来の方式で検索します');
      
      const today = new Date().toISOString().split('T')[0];
      
      // 今日の点呼記録を取得
      const records = await this.getTodayRecords(userId);
      
      const beforeRecords = records.filter(r => r.type === 'before');
      const afterRecords = records.filter(r => r.type === 'after');
      
      // セッション状態を構築
      const sessions: WorkSessionDetail[] = [];
      
      // work_session_idが存在する場合はそれでグループ化、存在しない場合は日付・車両でグループ化
      const sessionMap = new Map<string, { before?: TenkoRecord; after?: TenkoRecord }>();
      
      beforeRecords.forEach(record => {
        const sessionKey = record.work_session_id || `${record.date}_${record.vehicle_id}`;
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, {});
        }
        sessionMap.get(sessionKey)!.before = record;
      });
      
      afterRecords.forEach(record => {
        const sessionKey = record.work_session_id || `${record.date}_${record.vehicle_id}`;
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, {});
        }
        sessionMap.get(sessionKey)!.after = record;
      });
      
      for (const [sessionKey, session] of sessionMap) {
        if (session.before) {
          sessions.push({
            work_session_id: session.before.work_session_id || session.before.id,
            user_id: session.before.user_id,
            vehicle_id: session.before.vehicle_id,
            work_date: session.before.work_date || session.before.date,
            session_start: session.before.created_at,
            session_end: session.after?.created_at || null,
            before_count: 1,
            after_count: session.after ? 1 : 0,
            total_records: session.after ? 2 : 1,
            session_status: session.after ? 'completed' : 'in_progress' as const,
            before_record: session.before,
            after_record: session.after,
            vehicle: undefined
          });
        }
      }
      
      const activeSessions = sessions.filter(s => s.session_status === 'in_progress');
      const completedSessions = sessions.filter(s => s.session_status === 'completed');
      
      return {
        hasActiveSession: activeSessions.length > 0,
        hasCompletedSession: completedSessions.length > 0,
        activeSession: activeSessions[0],
        latestCompletedSession: completedSessions[0],
        canStartNewSession: activeSessions.length === 0
      };
    }
  }

  // 指定月の点呼記録と運行なし日を取得
  static async getMonthlyRecordsWithNoOperation(
    userId: string,
    year: number,
    month: number
  ): Promise<{ records: TenkoRecord[], noOperationDays: NoOperationDay[] }> {
    const { NoOperationService } = await import('./noOperationService');
    
    const [records, noOperationDays] = await Promise.all([
      this.getRecordsByMonth(userId, year, month),
      NoOperationService.getNoOperationDaysByMonth(userId, year, month)
    ]);
    
    return { records, noOperationDays };
  }

  // ユーザーの車両一覧を取得（VehicleServiceに委譲）
  static async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { VehicleService } = await import('./vehicleService');
    return VehicleService.getUserVehicles(userId);
  }

  // デフォルト車両を取得（VehicleServiceに委譲）
  static async getDefaultVehicle(userId: string): Promise<Vehicle | null> {
    const { VehicleService } = await import('./vehicleService');
    return VehicleService.getDefaultVehicle(userId);
  }

  // 点呼記録のリアルタイム購読
  static subscribeToTenkoRecords(
    userId: string,
    callback: (records: TenkoRecord[]) => void
  ) {
    return supabase
      .channel('tenko_records')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenko_records',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // 変更があった場合、今日の記録を再取得
          try {
            const records = await TenkoService.getTodayRecords(userId);
            callback(records);
          } catch (error) {
            console.error('リアルタイム更新エラー:', error);
          }
        }
      )
      .subscribe();
  }
}