-- Row Level Security (RLS) ポリシー設定
-- Week 2 Day 8-9: セキュリティ設定

-- RLSを有効化
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenko_records ENABLE ROW LEVEL SECURITY;

-- users_profile のポリシー
-- ユーザーは自分のプロフィールのみアクセス可能
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

-- vehicles のポリシー
-- ユーザーは自分の車両のみアクセス可能
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- tenko_records のポリシー
-- ユーザーは自分の点呼記録のみアクセス可能
CREATE POLICY "Users can view own tenko records" ON tenko_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenko records" ON tenko_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenko records" ON tenko_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenko records" ON tenko_records
  FOR DELETE USING (auth.uid() = user_id);