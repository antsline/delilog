-- delilog データベース初期スキーマ
-- Week 2 Day 8-9: データベース構築

-- 1. users_profile テーブル（拡張プロフィール）
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL, -- 屋号
  driver_name TEXT NOT NULL, -- 運転者名
  office_name TEXT, -- 営業所名（任意）
  subscription_tier TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. vehicles テーブル（車両情報）
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL, -- ナンバープレート
  vehicle_name TEXT, -- 車両名（任意）
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- デフォルト車両
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- アクティブ状態
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約
  UNIQUE(user_id, plate_number) -- 同一ユーザーで同じナンバープレートは不可
);

-- 3. tenko_records テーブル（点呼記録）
CREATE TABLE IF NOT EXISTS tenko_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- 記録日
  type TEXT NOT NULL CHECK (type IN ('before', 'after')), -- 業務前/業務後
  check_method TEXT NOT NULL DEFAULT '対面', -- 点呼方法
  executor TEXT NOT NULL DEFAULT '本人', -- 執行者
  alcohol_detector_used BOOLEAN NOT NULL DEFAULT TRUE, -- アルコール検知器使用
  alcohol_detected BOOLEAN NOT NULL DEFAULT FALSE, -- 酒気帯びの有無
  alcohol_level DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- アルコール数値
  notes TEXT, -- 特記事項
  
  -- 業務前点呼のみ
  health_status TEXT CHECK (health_status IN ('good', 'caution', 'poor')), -- 健康状態
  daily_check_completed BOOLEAN, -- 日常点検実施
  
  -- 業務後点呼のみ
  operation_status TEXT CHECK (operation_status IN ('ok', 'ng')), -- 運行状況
  
  -- メタデータ
  platform TEXT NOT NULL DEFAULT 'mobile' CHECK (platform IN ('mobile', 'web')), -- 記録プラットフォーム
  is_offline_created BOOLEAN NOT NULL DEFAULT FALSE, -- オフライン作成フラグ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約
  UNIQUE(user_id, date, type, vehicle_id) -- 同一日・同一タイプ・同一車両での重複記録防止
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users_profile(id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_default ON vehicles(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenko_records_user_date ON tenko_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tenko_records_vehicle ON tenko_records(vehicle_id);

-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時トリガー
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenko_records_updated_at BEFORE UPDATE ON tenko_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デフォルト車両の制約（ユーザーあたり1台のみ）
CREATE OR REPLACE FUNCTION ensure_single_default_vehicle()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- 他の車両のデフォルトフラグを解除
        UPDATE vehicles 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_vehicle_trigger 
BEFORE INSERT OR UPDATE ON vehicles 
FOR EACH ROW EXECUTE FUNCTION ensure_single_default_vehicle();