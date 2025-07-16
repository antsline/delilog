import { supabase } from './supabase';
import { TenkoRecord, TenkoRecordInsert, Vehicle, NoOperationDay, WorkSession, WorkSessionDetail } from '@/types/database';

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
      const workSessionId = crypto.randomUUID();
      const workDate = record.date; // 業務開始日を基準日とする
      
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
    }
    
    // 業務後点呼の場合は対応する業務前点呼のセッションを検索
    if (record.type === 'after') {
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
      
      // 業務後点呼が完了したら、セッションを完了状態に更新
      await supabase
        .from('work_sessions')
        .update({ 
          session_status: 'completed',
          session_end: new Date().toISOString()
        })
        .eq('work_session_id', activeSession.work_session_id);
      
      console.log('*** TenkoService: 業務後点呼完了でセッションを完了状態に更新:', {
        workSessionId: activeSession.work_session_id,
        timestamp: new Date().toISOString()
      });
      
      return data;
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
  }

  // 業務セッション詳細を取得
  static async getWorkSessionDetail(workSessionId: string): Promise<WorkSessionDetail | null> {
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
  }

  // ユーザーの業務セッション一覧を取得
  static async getUserWorkSessions(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<WorkSession[]> {
    let query = supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('work_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('work_date', endDate);
    }

    const { data, error } = await query.order('work_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // 今日のアクティブセッションを取得（ホーム画面用）
  static async getTodayActiveSession(userId: string): Promise<WorkSessionDetail | null> {
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
  }

  // 今日の業務セッション状況を取得（ホーム画面用）
  static async getTodaySessionStatus(userId: string): Promise<{
    hasActiveSession: boolean;
    hasCompletedSession: boolean;
    activeSession?: WorkSessionDetail;
    latestCompletedSession?: WorkSessionDetail;
    canStartNewSession: boolean;
  }> {
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
    
    // 実際のセッション状態を確認（データベースの状態が正しくない場合があるため）
    const actualActiveSessions = [];
    const actualCompletedSessions = [];
    
    for (const session of activeSessions) {
      const detail = await this.getWorkSessionDetail(session.work_session_id);
      if (detail) {
        // セッションに関連付けられていない業務後点呼レコードがある場合は、セッションを更新
        if (detail.before_record && !detail.after_record) {
          // 同じ車両・日付で業務後点呼があるかチェック
          const { data: orphanAfterRecord } = await supabase
            .from('tenko_records')
            .select('*')
            .eq('user_id', session.user_id)
            .eq('vehicle_id', session.vehicle_id)
            .eq('type', 'after')
            .eq('date', session.work_date)
            .is('work_session_id', null)
            .single();
          
          if (orphanAfterRecord) {
            // 孤立したレコードをセッションに関連付け
            await supabase
              .from('tenko_records')
              .update({
                work_session_id: session.work_session_id,
                work_date: session.work_date
              })
              .eq('id', orphanAfterRecord.id);
            
            // セッションを完了状態に更新
            await supabase
              .from('work_sessions')
              .update({
                session_status: 'completed',
                session_end: new Date().toISOString()
              })
              .eq('work_session_id', session.work_session_id);
            
            console.log('*** TenkoService: 孤立レコードをセッションに関連付け完了:', {
              sessionId: session.work_session_id,
              recordId: orphanAfterRecord.id,
              timestamp: new Date().toISOString()
            });
            
            // 更新後のセッション詳細を取得
            const updatedDetail = await this.getWorkSessionDetail(session.work_session_id);
            if (updatedDetail && updatedDetail.before_record && updatedDetail.after_record) {
              actualCompletedSessions.push(updatedDetail);
            } else {
              actualActiveSessions.push(detail);
            }
          } else {
            // 業務前のみならアクティブ
            actualActiveSessions.push(detail);
          }
        } else if (detail.before_record && detail.after_record) {
          // 両方の記録があるなら完了
          actualCompletedSessions.push(detail);
        } else if (detail.before_record) {
          // 業務前のみならアクティブ
          actualActiveSessions.push(detail);
        }
      }
    }
    
    for (const session of completedSessions) {
      const detail = await this.getWorkSessionDetail(session.work_session_id);
      if (detail) {
        actualCompletedSessions.push(detail);
      }
    }
    
    const hasActiveSession = actualActiveSessions.length > 0;
    const hasCompletedSession = actualCompletedSessions.length > 0;
    
    // アクティブセッション（業務前は完了、業務後は未完了）
    const activeSession = actualActiveSessions[0] || undefined;
    
    // 最新の完了セッション
    const latestCompletedSession = actualCompletedSessions[0] || undefined;
    
    // 新しいセッションを開始できるかどうか
    // アクティブセッションがない場合は新規開始可能
    const canStartNewSession = !hasActiveSession;
    
    return {
      hasActiveSession,
      hasCompletedSession,
      activeSession,
      latestCompletedSession,
      canStartNewSession
    };
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