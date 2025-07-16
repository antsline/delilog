# 業務セッション管理マイグレーション実行ガイド

## 概要

深夜業務での業務前・業務後点呼の適切な紐づけを実現するため、業務セッション管理機能を追加します。

## 実行前の確認事項

### 1. データのバックアップ
```sql
-- 重要なテーブルのバックアップを実行
pg_dump -t tenko_records your_database > backup_tenko_records_$(date +%Y%m%d).sql
```

### 2. アプリケーションの一時停止
- メンテナンス画面の表示
- 新しい点呼記録の作成を一時停止

## マイグレーション手順

### Step 1: マイグレーションの実行
```sql
-- Supabaseダッシュボードの「SQL Editor」で実行
\i database/migrations/004_work_session_support.sql
```

### Step 2: データの整合性確認
```sql
-- 1. work_session_idが正しく設定されているか確認
SELECT 
  type,
  COUNT(*) as total,
  COUNT(work_session_id) as with_session_id,
  COUNT(work_date) as with_work_date
FROM tenko_records 
GROUP BY type;

-- 2. 業務セッションビューが正常に動作するか確認
SELECT session_status, COUNT(*) 
FROM work_sessions 
GROUP BY session_status;

-- 3. 関数が正常に動作するか確認
SELECT get_active_work_session(
  'test-user-id'::uuid, 
  'test-vehicle-id'::uuid
);
```

### Step 3: アプリケーションのデプロイ
1. 新しいコードをデプロイ
2. アプリケーションの動作確認
3. メンテナンス画面の解除

## 期待される動作

### Before（修正前）
```
12/1 23:00 業務前点呼 → 記録A（date: 2024-12-01）
12/2 02:00 業務後点呼 → 記録B（date: 2024-12-02）
PDF生成: 記録Aと記録Bが別々の日として表示
```

### After（修正後）
```
12/1 23:00 業務前点呼 → 記録A（work_session_id: session-123, work_date: 2024-12-01）
12/2 02:00 業務後点呼 → 記録B（work_session_id: session-123, work_date: 2024-12-01）
PDF生成: 記録Aと記録Bが同一業務セッションとして12/1に表示
```

## トラブルシューティング

### 1. マイグレーション失敗時
```sql
-- ロールバック手順
ALTER TABLE tenko_records DROP COLUMN IF EXISTS work_session_id;
ALTER TABLE tenko_records DROP COLUMN IF EXISTS work_date;
DROP VIEW IF EXISTS work_sessions;
DROP FUNCTION IF EXISTS get_active_work_session;
```

### 2. 既存データの不整合
```sql
-- 業務後点呼で対応する業務前点呼が見つからない場合
SELECT tr.id, tr.date, tr.type, tr.work_session_id
FROM tenko_records tr
WHERE tr.type = 'after' 
  AND tr.work_session_id IS NULL;

-- 手動でwork_session_idを設定
UPDATE tenko_records 
SET work_session_id = gen_random_uuid()
WHERE type = 'after' AND work_session_id IS NULL;
```

### 3. パフォーマンス問題
```sql
-- インデックスの再構築
REINDEX INDEX idx_tenko_records_work_session_id;
REINDEX INDEX idx_tenko_records_work_date;

-- 統計情報の更新
ANALYZE tenko_records;
```

## 検証手順

### 1. 新しい業務前点呼の作成
- work_session_idが自動生成されることを確認
- work_dateが正しく設定されることを確認

### 2. 業務後点呼の作成
- 対応する業務前点呼のwork_session_idが使用されることを確認
- 深夜の業務後点呼が正しい業務前点呼と紐づくことを確認

### 3. PDF生成の確認
- 業務セッションが正しくグループ化されることを確認
- 深夜業務の記録が適切な日付に表示されることを確認

## 実装完了チェックリスト

- [ ] マイグレーション実行完了
- [ ] データ整合性確認完了
- [ ] アプリケーションデプロイ完了
- [ ] 新しい点呼記録作成テスト完了
- [ ] PDF生成テスト完了
- [ ] 深夜業務シナリオテスト完了
- [ ] ユーザー受け入れテスト完了

## ロールバック計画

万一問題が発生した場合：

1. アプリケーションを前のバージョンに戻す
2. データベースをバックアップから復元
3. マイグレーションをロールバック
4. 問題を特定・修正後に再度実行

## 問い合わせ

マイグレーション実行時に問題が発生した場合は、以下の情報を含めて報告してください：

- エラーメッセージ
- 実行したSQL文
- データベースのバージョン
- 影響を受けたレコード数