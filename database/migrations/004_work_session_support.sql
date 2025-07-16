-- 業務セッション管理のためのテーブル拡張
-- 作成日: 2025-07-16
-- 目的: 深夜業務での業務前・業務後点呼の適切な紐づけ対応

-- 1. tenko_recordsテーブルに業務セッションIDカラムを追加
ALTER TABLE tenko_records 
ADD COLUMN work_session_id UUID,
ADD COLUMN work_date DATE;

-- 2. work_session_idにインデックスを追加（検索性能向上）
CREATE INDEX idx_tenko_records_work_session_id ON tenko_records(work_session_id);
CREATE INDEX idx_tenko_records_work_date ON tenko_records(work_date);

-- 3. 既存データの移行（work_dateはdateと同じ値を設定）
UPDATE tenko_records 
SET work_date = date::DATE
WHERE work_date IS NULL;

-- 4. 既存データの業務前点呼にwork_session_idを生成
UPDATE tenko_records 
SET work_session_id = gen_random_uuid()
WHERE type = 'before' AND work_session_id IS NULL;

-- 5. 既存データの業務後点呼に対応する業務前点呼のwork_session_idを設定
WITH before_sessions AS (
  SELECT 
    user_id,
    vehicle_id,
    date,
    work_session_id
  FROM tenko_records 
  WHERE type = 'before' 
    AND work_session_id IS NOT NULL
)
UPDATE tenko_records AS tr
SET work_session_id = bs.work_session_id
FROM before_sessions AS bs
WHERE tr.type = 'after'
  AND tr.user_id = bs.user_id
  AND tr.vehicle_id = bs.vehicle_id
  AND tr.date = bs.date
  AND tr.work_session_id IS NULL;

-- 6. 新しいデータについてはwork_session_idを必須とする制約を追加
-- （一旦コメントアウト - アプリケーション側で対応してから有効化）
-- ALTER TABLE tenko_records 
-- ADD CONSTRAINT check_work_session_id_required 
-- CHECK (work_session_id IS NOT NULL);

-- 7. コメントを追加
COMMENT ON COLUMN tenko_records.work_session_id IS '業務セッションを識別するUUID。業務前点呼で生成され、対応する業務後点呼で同じIDを使用';
COMMENT ON COLUMN tenko_records.work_date IS '業務の基準日。深夜業務の場合は業務開始日を基準とする';

-- 8. 業務セッション管理のためのビューを作成
CREATE OR REPLACE VIEW work_sessions AS
SELECT 
  work_session_id,
  user_id,
  vehicle_id,
  work_date,
  MIN(CASE WHEN type = 'before' THEN created_at END) as session_start,
  MAX(CASE WHEN type = 'after' THEN created_at END) as session_end,
  COUNT(CASE WHEN type = 'before' THEN 1 END) as before_count,
  COUNT(CASE WHEN type = 'after' THEN 1 END) as after_count,
  COUNT(*) as total_records,
  CASE 
    WHEN COUNT(CASE WHEN type = 'before' THEN 1 END) > 0 
     AND COUNT(CASE WHEN type = 'after' THEN 1 END) > 0 THEN 'completed'
    WHEN COUNT(CASE WHEN type = 'before' THEN 1 END) > 0 THEN 'in_progress'
    ELSE 'invalid'
  END as session_status
FROM tenko_records
WHERE work_session_id IS NOT NULL
GROUP BY work_session_id, user_id, vehicle_id, work_date;

COMMENT ON VIEW work_sessions IS '業務セッションの状況を集約したビュー';

-- 9. RLSポリシーをwork_session_idに対しても適用
-- （work_sessionsビューは自動的にtenko_recordsのRLSポリシーを継承）

-- 10. 業務セッション検索用の関数を作成
CREATE OR REPLACE FUNCTION get_active_work_session(
  p_user_id UUID,
  p_vehicle_id UUID
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- 指定ユーザー・車両の未完了セッションを取得
  SELECT work_session_id INTO session_id
  FROM work_sessions
  WHERE user_id = p_user_id
    AND vehicle_id = p_vehicle_id
    AND session_status = 'in_progress'
  ORDER BY session_start DESC
  LIMIT 1;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_work_session IS '指定ユーザー・車両のアクティブな業務セッションIDを取得';