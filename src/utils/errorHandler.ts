/**
 * 統一的なエラーハンドリングシステム
 */

import { AppError, ErrorCode, ErrorSeverity, MultipleErrors, ErrorRecoveryOption, RecoveryStrategy } from '@/types/error';

export class ErrorHandler {
  private static sessionId = this.generateSessionId();

  /**
   * Supabaseエラーを統一的に処理
   */
  static handleSupabaseError(error: any, context?: string): AppError {
    const metadata = {
      context,
      originalError: error,
      timestamp: new Date(),
      stackTrace: error.stack,
    };

    // PostgreSQLエラーコードによる分類
    if (error.code) {
      switch (error.code) {
        case 'PGRST116': // No rows returned
          return {
            code: ErrorCode.DATA_NOT_FOUND,
            message: `No data found: ${error.message}`,
            userMessage: '該当するデータが見つかりません',
            severity: ErrorSeverity.LOW,
            recoverable: true,
            retryable: false,
            metadata,
          };

        case '23505': // Unique violation
          return {
            code: ErrorCode.DATA_CONFLICT,
            message: `Data conflict: ${error.message}`,
            userMessage: 'すでに同じデータが存在します',
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryable: false,
            metadata,
          };

        case '23503': // Foreign key violation
          return {
            code: ErrorCode.DATA_VALIDATION_ERROR,
            message: `Foreign key violation: ${error.message}`,
            userMessage: '関連するデータが見つかりません',
            severity: ErrorSeverity.MEDIUM,
            recoverable: false,
            retryable: false,
            metadata,
          };

        case '42P01': // Table doesn't exist
          return {
            code: ErrorCode.DATABASE_ERROR,
            message: `Table not found: ${error.message}`,
            userMessage: 'システムエラーが発生しました',
            severity: ErrorSeverity.CRITICAL,
            recoverable: false,
            retryable: false,
            metadata,
          };
      }
    }

    // HTTP ステータスコードによる分類
    if (error.status) {
      switch (error.status) {
        case 401:
          return {
            code: ErrorCode.AUTH_EXPIRED,
            message: `Authentication required: ${error.message}`,
            userMessage: '認証が必要です。再度ログインしてください',
            severity: ErrorSeverity.HIGH,
            recoverable: true,
            retryable: false,
            metadata,
          };

        case 403:
          return {
            code: ErrorCode.AUTH_PERMISSION_DENIED,
            message: `Permission denied: ${error.message}`,
            userMessage: 'この操作を実行する権限がありません',
            severity: ErrorSeverity.HIGH,
            recoverable: false,
            retryable: false,
            metadata,
          };

        case 404:
          return {
            code: ErrorCode.DATA_NOT_FOUND,
            message: `Resource not found: ${error.message}`,
            userMessage: '要求されたデータが見つかりません',
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryable: false,
            metadata,
          };

        case 429:
          return {
            code: ErrorCode.SERVER_ERROR,
            message: `Rate limit exceeded: ${error.message}`,
            userMessage: 'アクセスが集中しています。しばらく待ってから再試行してください',
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            retryable: true,
            metadata,
          };

        case 500:
        case 502:
        case 503:
        case 504:
          return {
            code: ErrorCode.SERVER_ERROR,
            message: `Server error: ${error.status} - ${error.message}`,
            userMessage: 'サーバーで問題が発生しています。しばらく待ってから再試行してください',
            severity: ErrorSeverity.HIGH,
            recoverable: true,
            retryable: true,
            metadata,
          };
      }
    }

    // デフォルトのデータベースエラー
    return {
      code: ErrorCode.DATABASE_ERROR,
      message: `Database error: ${error.message || error.toString()}`,
      userMessage: 'データベース処理でエラーが発生しました',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      metadata,
    };
  }

  /**
   * ネットワークエラーを統一的に処理
   */
  static handleNetworkError(error: any, context?: string): AppError {
    const metadata = {
      context,
      originalError: error,
      timestamp: new Date(),
      stackTrace: error.stack,
    };

    // エラーの種類による分類
    if (error.name === 'AbortError') {
      return {
        code: ErrorCode.OPERATION_CANCELLED,
        message: `Operation cancelled: ${error.message}`,
        userMessage: '操作がキャンセルされました',
        severity: ErrorSeverity.LOW,
        recoverable: true,
        retryable: true,
        metadata,
      };
    }

    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return {
        code: ErrorCode.CONNECTION_TIMEOUT,
        message: `Connection timeout: ${error.message}`,
        userMessage: '通信がタイムアウトしました。インターネット接続を確認してください',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        metadata,
      };
    }

    // ネットワーク接続エラー
    if (error.code === 'NETWORK_ERROR') {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: `Network error: ${error.message}`,
        userMessage: 'インターネット接続を確認してください',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        metadata,
      };
    }

    return {
      code: ErrorCode.NETWORK_ERROR,
      message: `Network error: ${error.message || error.toString()}`,
      userMessage: 'ネットワークエラーが発生しました',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      metadata,
    };
  }

  /**
   * 認証エラーを統一的に処理
   */
  static handleAuthError(error: any, provider?: string, context?: string): AppError {
    const metadata = {
      context,
      provider,
      originalError: error,
      timestamp: new Date(),
      stackTrace: error.stack,
    };

    // Apple認証エラー
    if (provider === 'apple') {
      if (error.code === '1001') {
        return {
          code: ErrorCode.OPERATION_CANCELLED,
          message: `Apple authentication cancelled: ${error.message}`,
          userMessage: 'Apple認証がキャンセルされました',
          severity: ErrorSeverity.LOW,
          recoverable: true,
          retryable: true,
          metadata,
        };
      }
    }

    // Google認証エラー
    if (provider === 'google') {
      if (error.type === 'cancel') {
        return {
          code: ErrorCode.OPERATION_CANCELLED,
          message: `Google authentication cancelled: ${error.message}`,
          userMessage: 'Google認証がキャンセルされました',
          severity: ErrorSeverity.LOW,
          recoverable: true,
          retryable: true,
          metadata,
        };
      }
    }

    // 一般的な認証エラー
    return {
      code: ErrorCode.AUTH_FAILED,
      message: `Authentication failed: ${error.message || error.toString()}`,
      userMessage: '認証に失敗しました。再度お試しください',
      severity: ErrorSeverity.HIGH,
      recoverable: true,
      retryable: true,
      metadata,
    };
  }

  /**
   * バリデーションエラーを統一的に処理
   */
  static handleValidationError(validationResult: any, context?: string): AppError {
    const metadata = {
      context,
      originalError: validationResult,
      timestamp: new Date(),
    };

    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: `Validation failed: ${JSON.stringify(validationResult.errors)}`,
      userMessage: '入力内容に不備があります。確認して再度お試しください',
      severity: ErrorSeverity.LOW,
      recoverable: true,
      retryable: false,
      metadata,
    };
  }

  /**
   * PDFエラーを統一的に処理
   */
  static handlePDFError(error: any, context?: string): AppError {
    const metadata = {
      context,
      originalError: error,
      timestamp: new Date(),
      stackTrace: error.stack,
    };

    if (error.message?.includes('sharing')) {
      return {
        code: ErrorCode.SHARING_UNAVAILABLE,
        message: `PDF sharing error: ${error.message}`,
        userMessage: 'PDFの共有機能が利用できません',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        metadata,
      };
    }

    return {
      code: ErrorCode.PDF_GENERATION_ERROR,
      message: `PDF generation error: ${error.message || error.toString()}`,
      userMessage: 'PDFの生成に失敗しました',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      metadata,
    };
  }

  /**
   * 未知のエラーを処理
   */
  static handleUnknownError(error: any, context?: string): AppError {
    const metadata = {
      context,
      originalError: error,
      timestamp: new Date(),
      stackTrace: error.stack,
    };

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: `Unknown error: ${error.message || error.toString()}`,
      userMessage: '予期しないエラーが発生しました',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      metadata,
    };
  }

  /**
   * 複数のエラーをまとめて処理
   */
  static handleMultipleErrors(errors: AppError[], successCount: number = 0): MultipleErrors {
    return {
      errors,
      partialSuccess: successCount > 0,
      successCount,
      failureCount: errors.length,
    };
  }

  /**
   * エラーに応じた復旧オプションを生成
   */
  static getRecoveryOptions(error: AppError): ErrorRecoveryOption[] {
    const options: ErrorRecoveryOption[] = [];

    if (error.retryable) {
      options.push({
        strategy: RecoveryStrategy.RETRY,
        label: '再試行',
        action: async () => {
          // 再試行のロジックは呼び出し側で実装
        },
        autoExecute: error.severity === ErrorSeverity.LOW,
        retryCount: 3,
        retryDelay: 1000,
      });
    }

    if (error.code === ErrorCode.AUTH_EXPIRED) {
      options.push({
        strategy: RecoveryStrategy.USER_ACTION,
        label: '再ログイン',
        action: async () => {
          // 再ログインのロジックは呼び出し側で実装
        },
      });
    }

    if (error.code === ErrorCode.NETWORK_ERROR) {
      options.push({
        strategy: RecoveryStrategy.FALLBACK,
        label: 'オフラインで続行',
        action: async () => {
          // オフライン対応のロジックは呼び出し側で実装
        },
      });
    }

    return options;
  }

  /**
   * セッションID生成
   */
  private static generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * エラーのログレベルを決定
   */
  static getLogLevel(error: AppError): 'debug' | 'info' | 'warn' | 'error' {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'warn';
    }
  }

  /**
   * エラーが自動的に報告されるべきかどうかを判定
   */
  static shouldAutoReport(error: AppError): boolean {
    return error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL;
  }
}