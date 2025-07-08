import { supabase } from './supabase';
import { NoOperationDay, NoOperationDayInsert } from '@/types/database';

export class NoOperationService {
  // 運行なし日を作成
  static async createNoOperationDay(data: NoOperationDayInsert): Promise<NoOperationDay> {
    const { data: result, error } = await supabase
      .from('no_operation_days')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // 運行なし日を削除
  static async deleteNoOperationDay(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('no_operation_days')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
  }

  // 指定期間の運行なし日を取得
  static async getNoOperationDaysByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<NoOperationDay[]> {
    const { data, error } = await supabase
      .from('no_operation_days')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 指定月の運行なし日を取得
  static async getNoOperationDaysByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<NoOperationDay[]> {
    // 月の最初と最後の日付を計算
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return this.getNoOperationDaysByDateRange(userId, startDate, endDate);
  }

  // 特定日が運行なしかどうかを確認
  static async isNoOperationDay(userId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('no_operation_days')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
      throw error;
    }

    return !!data;
  }

  // 運行なし日の切り替え（作成/削除）
  static async toggleNoOperationDay(
    userId: string, 
    date: string, 
    reason?: string
  ): Promise<boolean> {
    const isCurrentlyNoOperation = await this.isNoOperationDay(userId, date);
    
    if (isCurrentlyNoOperation) {
      // 運行なしを解除
      await this.deleteNoOperationDay(userId, date);
      return false;
    } else {
      // 運行なしに設定
      await this.createNoOperationDay({
        user_id: userId,
        date,
        reason
      });
      return true;
    }
  }
}