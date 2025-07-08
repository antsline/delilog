-- 運行なし日を記録するテーブル
CREATE TABLE IF NOT EXISTS no_operation_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT, -- 運行なしの理由（例：休日、メンテナンス、病気など）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同一ユーザー・同一日付の重複を防ぐ
  UNIQUE(user_id, date)
);

-- RLS (Row Level Security) の設定
ALTER TABLE no_operation_days ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own no_operation_days" ON no_operation_days
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own no_operation_days" ON no_operation_days
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own no_operation_days" ON no_operation_days
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own no_operation_days" ON no_operation_days
  FOR DELETE USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_no_operation_days_user_date ON no_operation_days(user_id, date);

-- updated_at の自動更新トリガー
CREATE OR REPLACE FUNCTION update_no_operation_days_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_no_operation_days_updated_at
  BEFORE UPDATE ON no_operation_days
  FOR EACH ROW
  EXECUTE FUNCTION update_no_operation_days_updated_at();