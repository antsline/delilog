import { supabase } from './supabase';
import { TenkoRecord, TenkoRecordInsert, Vehicle, NoOperationDay } from '@/types/database';

export class TenkoService {
  // 今日の点呼記録を取得
  static async getTodayRecords(userId: string): Promise<TenkoRecord[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const { data, error } = await supabase
      .from('tenko_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 点呼記録を作成
  static async createTenkoRecord(record: TenkoRecordInsert): Promise<TenkoRecord> {
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

  // 指定期間の点呼記録を取得
  static async getRecordsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TenkoRecord[]> {
    const { data, error } = await supabase
      .from('tenko_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('type', { ascending: true }); // before -> after

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