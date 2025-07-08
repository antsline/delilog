/**
 * アプリケーション全体で使用するエラー型定義
 */

export enum ErrorCode {
  // ネットワークエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // 認証エラー
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_PERMISSION_DENIED = 'AUTH_PERMISSION_DENIED',
  AUTH_PROVIDER_ERROR = 'AUTH_PROVIDER_ERROR',
  
  // データベースエラー
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  
  // ファイル・PDF エラー
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',
  SHARING_UNAVAILABLE = 'SHARING_UNAVAILABLE',
  
  // ユーザー入力エラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // アプリケーションエラー
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  FEATURE_UNAVAILABLE = 'FEATURE_UNAVAILABLE',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  /** エラーコード */
  code: ErrorCode;
  /** 技術的なエラーメッセージ（ログ用） */
  message: string;
  /** ユーザー向けのわかりやすいメッセージ */
  userMessage: string;
  /** エラーの重要度 */
  severity: ErrorSeverity;
  /** 自動復旧可能かどうか */
  recoverable: boolean;
  /** 再試行可能かどうか */
  retryable: boolean;
  /** エラーに関連する追加情報 */
  metadata?: {
    context?: string;
    operation?: string;
    userId?: string;
    timestamp?: Date;
    originalError?: any;
    stackTrace?: string;
  };
}

/**
 * 複数のエラーをまとめて表現する型
 */
export interface MultipleErrors {
  errors: AppError[];
  partialSuccess: boolean;
  successCount: number;
  failureCount: number;
}

/**
 * エラー復旧戦略
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  USER_ACTION = 'user_action',
  IGNORE = 'ignore',
}

export interface ErrorRecoveryOption {
  strategy: RecoveryStrategy;
  label: string;
  action: () => Promise<void>;
  autoExecute?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * エラーレポート用の型
 */
export interface ErrorReport {
  error: AppError;
  userAgent: string;
  appVersion: string;
  platform: string;
  userId?: string;
  sessionId: string;
  breadcrumbs: string[];
  additionalContext?: Record<string, any>;
}

/**
 * バリデーションエラーの詳細
 */
export interface ValidationErrorDetail {
  field: string;
  value: any;
  message: string;
  code: string;
}

export interface ValidationError extends AppError {
  code: ErrorCode.VALIDATION_ERROR;
  details: ValidationErrorDetail[];
}