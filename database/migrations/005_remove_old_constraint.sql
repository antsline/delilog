-- 古い重複制約を削除して業務セッション機能に対応
-- 作成日: 2025-07-16
-- 目的: 同日複数運行に対応するため、古い一意制約を削除

-- 1. 古い制約を削除（存在する場合のみ）
DO $$ 
BEGIN
    -- tenko_records_user_id_date_type_key 制約を削除
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenko_records_user_id_date_type_key' 
        AND table_name = 'tenko_records'
    ) THEN
        ALTER TABLE tenko_records DROP CONSTRAINT tenko_records_user_id_date_type_key;
        RAISE NOTICE '古い一意制約 tenko_records_user_id_date_type_key を削除しました';
    ELSE
        RAISE NOTICE '制約 tenko_records_user_id_date_type_key は存在しません';
    END IF;
    
    -- tenko_records_user_id_date_type_vehicle_id_key 制約も削除（存在する場合）
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenko_records_user_id_date_type_vehicle_id_key' 
        AND table_name = 'tenko_records'
    ) THEN
        ALTER TABLE tenko_records DROP CONSTRAINT tenko_records_user_id_date_type_vehicle_id_key;
        RAISE NOTICE '古い一意制約 tenko_records_user_id_date_type_vehicle_id_key を削除しました';
    ELSE
        RAISE NOTICE '制約 tenko_records_user_id_date_type_vehicle_id_key は存在しません';
    END IF;
END $$;

-- 2. 業務セッション対応の新しい制約を追加
-- work_session_id と type の組み合わせで一意性を保証（1つのセッションに業務前・業務後それぞれ1つまで）
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenko_records_session_type_unique 
ON tenko_records(work_session_id, type) 
WHERE work_session_id IS NOT NULL;

-- 3. 制約の確認用クエリ（実行後に確認）
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'tenko_records' AND constraint_type = 'UNIQUE';