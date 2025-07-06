import { supabase } from './supabase';
import { Vehicle, VehicleInsert } from '@/types/database';

export class VehicleService {
  // ユーザーの車両一覧を取得
  static async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // デフォルト車両を取得
  static async getDefaultVehicle(userId: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows returned
    return data || null;
  }

  // 車両を作成
  static async createVehicle(vehicleData: VehicleInsert): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 車両を更新
  static async updateVehicle(id: string, updates: Partial<VehicleInsert>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 車両を削除（論理削除）
  static async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // デフォルト車両を設定
  static async setDefaultVehicle(vehicleId: string, userId: string): Promise<Vehicle> {
    // 指定した車両をデフォルトに設定（トリガーで他のデフォルトは自動解除）
    const { data, error } = await supabase
      .from('vehicles')
      .update({ is_default: true })
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}