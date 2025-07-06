# delilog API仕様書（Supabase スキーマ定義）

## 1. データベーススキーマ

### 1.1 テーブル定義

#### users_profile

ユーザーの拡張プロフィール情報

```sql
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

-- インデックス
CREATE INDEX idx_users_profile_subscription ON users_profile(subscription_tier, subscription_status);
```

#### vehicles

車両情報

```sql
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

-- インデックス
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_is_default ON vehicles(user_id, is_default) WHERE is_default = TRUE;
```

#### tenko_records

点呼記録

```sql
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

-- インデックス
CREATE INDEX idx_tenko_records_user_date ON tenko_records(user_id, date DESC);
CREATE INDEX idx_tenko_records_sync ON tenko_records(user_id, is_offline_created) WHERE is_offline_created = TRUE;
```

#### operation_records

運行記録（Phase 2）

```sql
CREATE TABLE operation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_location TEXT NOT NULL,
  end_location TEXT,
  distance DECIMAL(10, 2),
  main_stops JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_operation_records_user_date ON operation_records(user_id, date DESC);
```

### 1.2 ビュー定義

#### daily_summary_view

日次サマリービュー

```sql
CREATE VIEW daily_summary_view AS
SELECT
  t.user_id,
  t.date,
  MAX(CASE WHEN t.type = 'before' THEN t.created_at END) as before_check_time,
  MAX(CASE WHEN t.type = 'after' THEN t.created_at END) as after_check_time,
  BOOL_OR(CASE WHEN t.type = 'before' THEN TRUE ELSE FALSE END) as has_before_check,
  BOOL_OR(CASE WHEN t.type = 'after' THEN TRUE ELSE FALSE END) as has_after_check,
  MAX(o.distance) as total_distance
FROM tenko_records t
LEFT JOIN operation_records o ON t.user_id = o.user_id AND t.date = o.date
GROUP BY t.user_id, t.date;
```

## 2. Row Level Security (RLS) ポリシー

### 2.1 users_profile

```sql
-- 読み取り：自分のプロフィールのみ
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

-- 作成：自分のプロフィールのみ
CREATE POLICY "Users can create own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 更新：自分のプロフィールのみ
CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);
```

### 2.2 vehicles

```sql
-- 読み取り：自分の車両のみ
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

-- 作成：自分の車両のみ（ベーシックプランは3台まで）
CREATE POLICY "Users can create vehicles" ON vehicles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      (SELECT subscription_tier FROM users_profile WHERE id = auth.uid()) = 'pro' OR
      (SELECT COUNT(*) FROM vehicles WHERE user_id = auth.uid() AND is_active = TRUE) < 3
    )
  );

-- 更新：自分の車両のみ
CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

-- 削除：自分の車両のみ
CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);
```

### 2.3 tenko_records

```sql
-- 読み取り：自分の記録のみ
CREATE POLICY "Users can view own tenko records" ON tenko_records
  FOR SELECT USING (auth.uid() = user_id);

-- 作成：自分の記録のみ
CREATE POLICY "Users can create tenko records" ON tenko_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新：自分の記録のみ（24時間以内）
CREATE POLICY "Users can update recent tenko records" ON tenko_records
  FOR UPDATE USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- 削除：自分の記録のみ（24時間以内）
CREATE POLICY "Users can delete recent tenko records" ON tenko_records
  FOR DELETE USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );
```

## 3. Edge Functions

### 3.1 /api/generate-pdf

PDF生成エンドポイント

```typescript
// Request
interface GeneratePdfRequest {
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// Response
interface GeneratePdfResponse {
  pdfUrl: string;
  expiresAt: string; // ISO 8601
}

// Error Response
interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}
```

### 3.2 /api/weekly-report

週次レポート生成

```typescript
// Request
interface WeeklyReportRequest {
  userId: string;
  weekStartDate: string; // YYYY-MM-DD (日曜日)
}

// Response
interface WeeklyReportResponse {
  summary: {
    totalDays: number;
    completedDays: number;
    incompleteDays: number;
    totalDistance?: number;
  };
  dailyRecords: Array<{
    date: string;
    beforeCheck?: {
      time: string;
      alcoholLevel: number;
      healthStatus: string;
    };
    afterCheck?: {
      time: string;
      alcoholLevel: number;
      operationStatus: string;
    };
    notes?: string;
  }>;
}
```

### 3.3 /api/offline-sync

オフラインデータ同期

```typescript
// Request
interface OfflineSyncRequest {
  userId: string;
  records: Array<{
    localId: string;
    data: Partial<TenkoRecord>;
    createdAt: string;
  }>;
}

// Response
interface OfflineSyncResponse {
  synced: Array<{
    localId: string;
    serverId: string;
  }>;
  failed: Array<{
    localId: string;
    error: string;
  }>;
}
```

## 4. Realtime サブスクリプション

### 4.1 点呼記録の更新監視

```typescript
// 今日の記録をリアルタイムで監視
const channel = supabase
  .channel('today-tenko-records')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tenko_records',
      filter: `user_id=eq.${userId} AND date=eq.${today}`,
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

## 5. ストレージ構造

### 5.1 バケット構成

```
receipts/
  └── {user_id}/
      └── {year}/
          └── {month}/
              └── {filename}

exports/
  └── {user_id}/
      └── pdf/
          └── {filename}
      └── csv/
          └── {filename}
```

### 5.2 アクセスポリシー

```sql
-- receiptsバケット：自分のファイルのみアクセス可能
CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. エラーコード一覧

| コード                 | 説明                              | HTTPステータス |
| ---------------------- | --------------------------------- | -------------- |
| AUTH_REQUIRED          | 認証が必要です                    | 401            |
| AUTH_INVALID           | 認証情報が無効です                | 401            |
| PERMISSION_DENIED      | アクセス権限がありません          | 403            |
| NOT_FOUND              | リソースが見つかりません          | 404            |
| VALIDATION_ERROR       | 入力値が不正です                  | 400            |
| DUPLICATE_RECORD       | 重複する記録があります            | 409            |
| VEHICLE_LIMIT_EXCEEDED | 車両登録数の上限を超えています    | 400            |
| SUBSCRIPTION_REQUIRED  | この機能はプロプランが必要です    | 402            |
| RATE_LIMIT_EXCEEDED    | APIリクエスト数の上限を超えました | 429            |
| INTERNAL_ERROR         | サーバーエラーが発生しました      | 500            |

## 7. API利用制限

### 7.1 レート制限

- 認証済みユーザー：100リクエスト/分
- 未認証ユーザー：10リクエスト/分

### 7.2 データ制限

- ベーシックプラン
  - 車両登録：3台まで
  - データ保存期間：1年間
  - PDF生成：無制限

- プロプラン
  - 車両登録：無制限
  - データ保存期間：3年間
  - PDF生成：無制限
  - API連携：可能

## 8. 環境変数

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Edge Functions
EDGE_FUNCTION_URL=https://xxxxx.supabase.co/functions/v1

# Storage
STORAGE_URL=https://xxxxx.supabase.co/storage/v1
```
