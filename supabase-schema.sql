-- delilog データベーススキーマ
-- Supabase SQL Editorで実行してください

-- 1. users_profile テーブル
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  office_name TEXT,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- users_profile インデックス
CREATE INDEX idx_users_profile_subscription ON users_profile(subscription_tier, subscription_status);

-- 2. vehicles テーブル
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  vehicle_name TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, plate_number)
);

-- vehicles インデックス
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_is_default ON vehicles(user_id, is_default) WHERE is_default = TRUE;

-- 3. tenko_records テーブル
CREATE TABLE tenko_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('before', 'after')),

  -- 共通項目
  check_method TEXT DEFAULT '対面',
  executor TEXT DEFAULT '本人',
  alcohol_detector_used BOOLEAN DEFAULT TRUE,
  alcohol_detected BOOLEAN DEFAULT FALSE,
  alcohol_level DECIMAL(3, 2) DEFAULT 0.00,
  notes TEXT,

  -- 業務前点呼
  health_status TEXT CHECK (health_status IN ('good', 'caution', 'poor')),
  daily_check_completed BOOLEAN,

  -- 業務後点呼
  operation_status TEXT CHECK (operation_status IN ('ok', 'ng')),

  -- メタデータ
  platform TEXT DEFAULT 'mobile' CHECK (platform IN ('mobile', 'web')),
  is_offline_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date, type)
);

-- tenko_records インデックス
CREATE INDEX idx_tenko_records_user_date ON tenko_records(user_id, date DESC);
CREATE INDEX idx_tenko_records_sync ON tenko_records(user_id, is_offline_created) WHERE is_offline_created = TRUE;

-- 4. RLS (Row Level Security) ポリシーの有効化
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenko_records ENABLE ROW LEVEL SECURITY;

-- 5. users_profile RLSポリシー
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

-- 6. vehicles RLSポリシー
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create vehicles" ON vehicles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      (SELECT subscription_tier FROM users_profile WHERE id = auth.uid()) = 'pro' OR
      (SELECT COUNT(*) FROM vehicles WHERE user_id = auth.uid() AND is_active = TRUE) < 3
    )
  );

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- 7. tenko_records RLSポリシー
CREATE POLICY "Users can view own tenko records" ON tenko_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tenko records" ON tenko_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update recent tenko records" ON tenko_records
  FOR UPDATE USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Users can delete recent tenko records" ON tenko_records
  FOR DELETE USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- 8. 日次サマリービュー
CREATE VIEW daily_summary_view AS
SELECT
  t.user_id,
  t.date,
  MAX(CASE WHEN t.type = 'before' THEN t.created_at END) as before_check_time,
  MAX(CASE WHEN t.type = 'after' THEN t.created_at END) as after_check_time,
  BOOL_OR(CASE WHEN t.type = 'before' THEN TRUE ELSE FALSE END) as has_before_check,
  BOOL_OR(CASE WHEN t.type = 'after' THEN TRUE ELSE FALSE END) as has_after_check
FROM tenko_records t
GROUP BY t.user_id, t.date;

-- 9. updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. updated_atトリガーの作成
CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenko_records_updated_at
    BEFORE UPDATE ON tenko_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();