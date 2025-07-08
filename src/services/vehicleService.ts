import { supabase } from './supabase';
import { Vehicle, VehicleInsert } from '@/types/database';

export class VehicleService {
  // ユーザーの車両一覧を取得
  static async getUserVehicles(userId: string): Promise<Vehicle[]> {
    console.log('VehicleService.getUserVehicles called with userId:', userId);
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error in getUserVehicles:', error);
      throw error;
    }
    
    console.log('Raw data from database:', data);
    if (data) {
      data.forEach((vehicle, index) => {
        console.log(`DB車両[${index}]:`, {
          id: vehicle.id,
          plate_number: vehicle.plate_number,
          plate_number_json: JSON.stringify(vehicle.plate_number),
          vehicle_name: vehicle.vehicle_name,
          is_default: vehicle.is_default,
          user_id: vehicle.user_id,
          created_at: vehicle.created_at
        });
      });
    }
    
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
    console.log('VehicleService.createVehicle called with data:', vehicleData);
    console.log('plate_number in createVehicle:', JSON.stringify(vehicleData.plate_number));
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) {
      console.error('Database error in createVehicle:', error);
      throw error;
    }
    
    console.log('Created vehicle:', data);
    console.log('Created vehicle plate_number:', JSON.stringify(data.plate_number));
    return data;
  }

  // 車両を更新
  static async updateVehicle(id: string, updates: Partial<VehicleInsert>): Promise<Vehicle> {
    console.log('VehicleService.updateVehicle called with id:', id, 'updates:', updates);
    if (updates.plate_number) {
      console.log('plate_number in updateVehicle:', JSON.stringify(updates.plate_number));
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error in updateVehicle:', error);
      throw error;
    }
    
    console.log('Updated vehicle:', data);
    console.log('Updated vehicle plate_number:', JSON.stringify(data.plate_number));
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