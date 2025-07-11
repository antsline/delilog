/**
 * オフライン機能専用のエラーハンドリングサービス
 */

import { Logger } from '@/utils/logger';

export interface OfflineError {
  id: string;
  type: 'network' | 'storage' | 'sync' | 'data' | 'permission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: any;
  timestamp: string;
  resolved: boolean;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'cache' | 'user_action' | 'ignore';
  action?: () => Promise<void>;
  maxRetries?: number;
  delay?: number;
}

export class OfflineErrorHandler {
  private static errors: OfflineError[] = [];
  private static readonly MAX_ERRORS = 100;

  /**
   * エラーの記録
   */
  static recordError(
    type: OfflineError['type'],
    severity: OfflineError['severity'],
    message: string,
    context?: any
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const error: OfflineError = {
      id: errorId,
      type,
      severity,
      message,
      context,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    // エラーリストに追加（最大数を超えたら古いものを削除）
    this.errors.unshift(error);
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(0, this.MAX_ERRORS);
    }

    // ログ出力
    const logMessage = `[${type.toUpperCase()}] ${message}`;
    switch (severity) {
      case 'critical':
        Logger.error(logMessage, context);
        break;
      case 'high':
        Logger.warn(logMessage, context);
        break;
      case 'medium':
        Logger.info(logMessage, context);
        break;
      case 'low':
        Logger.debug(logMessage, context);
        break;
    }

    return errorId;
  }

  /**
   * ネットワークエラーの処理
   */
  static async handleNetworkError(error: any, operation: string): Promise<ErrorRecoveryStrategy> {
    const errorId = this.recordError(
      'network',
      'high',
      `ネットワークエラー: ${operation}`,
      { error: error.message, operation }
    );

    // ネットワークエラーの種類を判定
    if (this.isConnectionTimeout(error)) {
      return {
        type: 'retry',
        maxRetries: 3,
        delay: 2000,
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      };
    }

    if (this.isOfflineError(error)) {
      return {
        type: 'cache',
        action: async () => {
          Logger.info('オフラインモードに切り替え');
        }
      };
    }

    return {
      type: 'fallback',
      action: async () => {
        Logger.info('フォールバック処理を実行');
      }
    };
  }

  /**
   * ストレージエラーの処理
   */
  static async handleStorageError(error: any, operation: string): Promise<ErrorRecoveryStrategy> {
    const errorId = this.recordError(
      'storage',
      'critical',
      `ストレージエラー: ${operation}`,
      { error: error.message, operation }
    );

    // ストレージ容量不足の場合
    if (this.isStorageFullError(error)) {
      return {
        type: 'user_action',
        action: async () => {
          Logger.warn('ストレージ容量不足 - ユーザーにクリーンアップを促す');
        }
      };
    }

    // 権限エラーの場合
    if (this.isPermissionError(error)) {
      return {
        type: 'user_action',
        action: async () => {
          Logger.warn('ストレージ権限エラー - ユーザーに権限許可を促す');
        }
      };
    }

    return {
      type: 'retry',
      maxRetries: 2,
      delay: 1000
    };
  }

  /**
   * 同期エラーの処理
   */
  static async handleSyncError(error: any, itemId: string, operation: string): Promise<ErrorRecoveryStrategy> {
    const errorId = this.recordError(
      'sync',
      'medium',
      `同期エラー: ${operation}`,
      { error: error.message, itemId, operation }
    );

    // 競合エラーの場合
    if (this.isConflictError(error)) {
      return {
        type: 'user_action',
        action: async () => {
          Logger.info('データ競合を検出 - ユーザーに解決方法を提示');
        }
      };
    }

    // サーバーエラーの場合
    if (this.isServerError(error)) {
      return {
        type: 'retry',
        maxRetries: 5,
        delay: 5000
      };
    }

    return {
      type: 'retry',
      maxRetries: 3,
      delay: 2000
    };
  }

  /**
   * データ整合性エラーの処理
   */
  static async handleDataError(error: any, operation: string): Promise<ErrorRecoveryStrategy> {
    const errorId = this.recordError(
      'data',
      'high',
      `データエラー: ${operation}`,
      { error: error.message, operation }
    );

    return {
      type: 'fallback',
      action: async () => {
        Logger.warn('データ整合性エラー - セーフモードで動作');
      }
    };
  }

  /**
   * エラーの解決をマーク
   */
  static resolveError(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      Logger.info(`エラー解決: ${errorId}`);
    }
  }

  /**
   * 全エラーの取得
   */
  static getAllErrors(): OfflineError[] {
    return [...this.errors];
  }

  /**
   * 未解決エラーの取得
   */
  static getUnresolvedErrors(): OfflineError[] {
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * 重要度別エラー数の取得
   */
  static getErrorCounts(): Record<OfflineError['severity'], number> {
    const unresolvedErrors = this.getUnresolvedErrors();
    return {
      low: unresolvedErrors.filter(e => e.severity === 'low').length,
      medium: unresolvedErrors.filter(e => e.severity === 'medium').length,
      high: unresolvedErrors.filter(e => e.severity === 'high').length,
      critical: unresolvedErrors.filter(e => e.severity === 'critical').length,
    };
  }

  /**
   * エラーの自動復旧処理
   */
  static async attemptAutoRecovery(error: OfflineError): Promise<boolean> {
    try {
      const strategy = await this.getRecoveryStrategy(error);
      
      if (strategy.type === 'retry' && strategy.action) {
        const maxRetries = strategy.maxRetries || 1;
        const delay = strategy.delay || 1000;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            await strategy.action();
            this.resolveError(error.id);
            return true;
          } catch (retryError) {
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      }
      
      if (strategy.action && strategy.type !== 'retry') {
        await strategy.action();
        this.resolveError(error.id);
        return true;
      }
      
    } catch (recoveryError) {
      Logger.error('自動復旧失敗', { originalError: error, recoveryError });
    }
    
    return false;
  }

  /**
   * エラーに対する復旧戦略の取得
   */
  private static async getRecoveryStrategy(error: OfflineError): Promise<ErrorRecoveryStrategy> {
    switch (error.type) {
      case 'network':
        return this.handleNetworkError(new Error(error.message), error.context?.operation || 'unknown');
      case 'storage':
        return this.handleStorageError(new Error(error.message), error.context?.operation || 'unknown');
      case 'sync':
        return this.handleSyncError(new Error(error.message), error.context?.itemId || 'unknown', error.context?.operation || 'unknown');
      case 'data':
        return this.handleDataError(new Error(error.message), error.context?.operation || 'unknown');
      default:
        return { type: 'ignore' };
    }
  }

  // エラー判定ヘルパーメソッド
  private static isConnectionTimeout(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('timeout') || message.includes('connection') || message.includes('timed out');
  }

  private static isOfflineError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('offline') || message.includes('network request failed') || message.includes('no internet');
  }

  private static isStorageFullError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('storage full') || message.includes('quota exceeded') || message.includes('disk full');
  }

  private static isPermissionError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('permission') || message.includes('access denied') || message.includes('unauthorized');
  }

  private static isConflictError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('conflict') || message.includes('version') || message.includes('競合');
  }

  private static isServerError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('server error') || message.includes('internal server') || message.includes('5');
  }

  /**
   * エラーのクリア
   */
  static clearErrors(): void {
    this.errors = [];
    Logger.info('全エラーをクリアしました');
  }

  /**
   * 解決済みエラーのクリア
   */
  static clearResolvedErrors(): void {
    this.errors = this.errors.filter(e => !e.resolved);
    Logger.info('解決済みエラーをクリアしました');
  }
}