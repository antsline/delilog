export interface UserProfile {
  id: string;
  company_name: string;
  driver_name: string;
  office_name?: string;
  subscription_tier: 'basic' | 'pro';
  subscription_status: 'active' | 'cancelled' | 'past_due';
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  plate_number: string;
  vehicle_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenkoRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  type: 'before' | 'after';
  check_method: string;
  executor: string;
  alcohol_detector_used: boolean;
  alcohol_detected: boolean;
  alcohol_level: number;
  notes?: string;
  health_status?: 'good' | 'caution' | 'poor';
  daily_check_completed?: boolean;
  operation_status?: 'ok' | 'ng';
  platform: 'mobile' | 'web';
  is_offline_created: boolean;
  work_session_id?: string; // 業務セッションID
  work_date?: string; // 業務基準日（YYYY-MM-DD）
  created_at: string;
  updated_at: string;
}

export interface NoOperationDay {
  id: string;
  user_id: string;
  date: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

// 業務セッション情報
export interface WorkSession {
  work_session_id: string;
  user_id: string;
  vehicle_id: string;
  work_date: string;
  session_start: string | null; // 業務前点呼の作成日時
  session_end: string | null; // 業務後点呼の作成日時
  before_count: number;
  after_count: number;
  total_records: number;
  session_status: 'completed' | 'in_progress' | 'invalid';
}

// 業務セッションの詳細情報（点呼記録含む）
export interface WorkSessionDetail extends WorkSession {
  before_record?: TenkoRecord;
  after_record?: TenkoRecord;
  vehicle?: Vehicle;
}

// Insert用の型定義
export interface NoOperationDayInsert {
  user_id: string;
  date: string;
  reason?: string;
}

export interface UserProfileInsert {
  id: string;
  company_name: string;
  driver_name: string;
  office_name?: string;
  subscription_tier?: 'basic' | 'pro';
  subscription_status?: 'active' | 'cancelled' | 'past_due';
}

export interface VehicleInsert {
  user_id: string;
  plate_number: string;
  vehicle_name?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface TenkoRecordInsert {
  user_id: string;
  vehicle_id: string;
  date: string;
  type: 'before' | 'after';
  check_method?: string;
  executor?: string;
  alcohol_detector_used?: boolean;
  alcohol_detected?: boolean;
  alcohol_level?: number;
  notes?: string;
  health_status?: 'good' | 'caution' | 'poor';
  daily_check_completed?: boolean;
  operation_status?: 'ok' | 'ng';
  platform?: 'mobile' | 'web';
  is_offline_created?: boolean;
}

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: VehicleInsert;
        Update: Partial<Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      tenko_records: {
        Row: TenkoRecord;
        Insert: TenkoRecordInsert;
        Update: Partial<Omit<TenkoRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}