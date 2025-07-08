/**
 * エラー状態管理ストア
 */

import { create } from 'zustand';
import { AppError, ErrorRecoveryOption, MultipleErrors } from '@/types/error';
import { ErrorHandler } from '@/utils/errorHandler';

interface ErrorState {
  // 現在表示中のエラー
  currentError: AppError | null;
  // エラー履歴（デバッグ用）
  errorHistory: AppError[];
  // 複数エラーの状態
  multipleErrors: MultipleErrors | null;
  // 復旧オプション
  recoveryOptions: ErrorRecoveryOption[];
  // 再試行カウント
  retryCount: number;
  // エラー表示中かどうか
  isShowingError: boolean;
  // 自動復旧中かどうか
  isAutoRecovering: boolean;

  // アクション
  showError: (error: AppError, options?: { autoRecover?: boolean }) => void;
  showMultipleErrors: (multipleErrors: MultipleErrors) => void;
  clearError: () => void;
  clearAllErrors: () => void;
  retryOperation: (operation: () => Promise<void>) => Promise<void>;
  executeRecovery: (option: ErrorRecoveryOption) => Promise<void>;
  addToHistory: (error: AppError) => void;
  getErrorById: (id: string) => AppError | undefined;
  
  // エラー統計
  getErrorStats: () => {
    totalErrors: number;
    criticalErrors: number;
    lastError: AppError | null;
  };
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  currentError: null,
  errorHistory: [],
  multipleErrors: null,
  recoveryOptions: [],
  retryCount: 0,
  isShowingError: false,
  isAutoRecovering: false,

  showError: (error: AppError, options = {}) => {
    const state = get();
    
    // エラー履歴に追加
    const newHistory = [...state.errorHistory, error].slice(-50); // 最新50件のみ保持
    
    // 復旧オプションを生成
    const recoveryOptions = ErrorHandler.getRecoveryOptions(error);
    
    set({
      currentError: error,
      errorHistory: newHistory,
      recoveryOptions,
      isShowingError: true,
      multipleErrors: null,
    });

    // 自動復旧の実行
    if (options.autoRecover && error.recoverable) {
      // 内部の非公開メソッドを実行
      setTimeout(() => {
        const state = get();
        const recoveryOptions = ErrorHandler.getRecoveryOptions(error);
        const autoOption = recoveryOptions.find(option => option.autoExecute);
        
        if (autoOption && error.retryable) {
          state.executeRecovery(autoOption).catch(console.error);
        }
      }, 0);
    }

    // 自動レポート
    if (ErrorHandler.shouldAutoReport(error)) {
      // 内部の非公開メソッドを実行  
      setTimeout(() => {
        try {
          if (__DEV__) {
            console.log('Error report:', {
              code: error.code,
              severity: error.severity,
              timestamp: error.metadata?.timestamp,
              context: error.metadata?.context,
            });
          } else {
            console.log('Error occurred:', {
              code: error.code,
              severity: error.severity,
              timestamp: error.metadata?.timestamp,
            });
          }
        } catch (reportError) {
          console.error('Error reporting failed:', reportError);
        }
      }, 0);
    }
  },

  showMultipleErrors: (multipleErrors: MultipleErrors) => {
    set({
      multipleErrors,
      currentError: null,
      isShowingError: true,
      recoveryOptions: [],
    });

    // 最も重要なエラーを履歴に追加
    const criticalErrors = multipleErrors.errors.filter(e => e.severity === 'critical');
    const mostImportant = criticalErrors[0] || multipleErrors.errors[0];
    
    if (mostImportant) {
      get().addToHistory(mostImportant);
    }
  },

  clearError: () => {
    set({
      currentError: null,
      multipleErrors: null,
      isShowingError: false,
      recoveryOptions: [],
      retryCount: 0,
      isAutoRecovering: false,
    });
  },

  clearAllErrors: () => {
    set({
      currentError: null,
      multipleErrors: null,
      errorHistory: [],
      isShowingError: false,
      recoveryOptions: [],
      retryCount: 0,
      isAutoRecovering: false,
    });
  },

  retryOperation: async (operation: () => Promise<void>) => {
    const state = get();
    const maxRetries = 3;
    
    if (state.retryCount >= maxRetries) {
      throw new Error('最大再試行回数に達しました');
    }

    set({ retryCount: state.retryCount + 1, isAutoRecovering: true });

    try {
      await operation();
      // 成功した場合はエラーをクリア
      get().clearError();
    } catch (error: any) {
      // 再試行も失敗した場合
      if (state.retryCount >= maxRetries) {
        const appError = ErrorHandler.handleUnknownError(error, 'retry operation');
        get().showError(appError);
      }
      throw error;
    } finally {
      set({ isAutoRecovering: false });
    }
  },

  executeRecovery: async (option: ErrorRecoveryOption) => {
    set({ isAutoRecovering: true });
    
    try {
      await option.action();
      
      // 復旧成功の場合はエラーをクリア
      if (option.strategy !== 'user_action') {
        get().clearError();
      }
    } catch (error: any) {
      // 復旧処理自体が失敗した場合
      const recoveryError = ErrorHandler.handleUnknownError(error, 'error recovery');
      get().showError(recoveryError);
    } finally {
      set({ isAutoRecovering: false });
    }
  },

  addToHistory: (error: AppError) => {
    const state = get();
    const newHistory = [...state.errorHistory, error].slice(-50);
    set({ errorHistory: newHistory });
  },

  getErrorById: (id: string) => {
    const state = get();
    return state.errorHistory.find(error => 
      error.metadata?.timestamp?.getTime().toString() === id
    );
  },

  getErrorStats: () => {
    const state = get();
    return {
      totalErrors: state.errorHistory.length,
      criticalErrors: state.errorHistory.filter(e => e.severity === 'critical').length,
      lastError: state.errorHistory[state.errorHistory.length - 1] || null,
    };
  },

}));

// エラーストア用のヘルパー関数
export const errorStoreHelpers = {
  /**
   * 非同期処理をエラーハンドリング付きで実行
   */
  withErrorHandling: async <T>(
    operation: () => Promise<T>,
    context?: string,
    autoRecover = false
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      const appError = ErrorHandler.handleUnknownError(error, context);
      useErrorStore.getState().showError(appError, { autoRecover });
      throw appError;
    }
  },

  /**
   * 複数の非同期処理を並行実行（部分的成功を許可）
   */
  withPartialSuccess: async <T>(
    operations: Array<() => Promise<T>>,
    context?: string
  ): Promise<{ results: T[]; errors: AppError[] }> => {
    const results: T[] = [];
    const errors: AppError[] = [];

    const promises = operations.map(async (operation, index) => {
      try {
        const result = await operation();
        results[index] = result;
      } catch (error: any) {
        const appError = ErrorHandler.handleUnknownError(error, `${context}_${index}`);
        errors.push(appError);
      }
    });

    await Promise.allSettled(promises);

    if (errors.length > 0) {
      const multipleErrors = ErrorHandler.handleMultipleErrors(errors, results.length);
      useErrorStore.getState().showMultipleErrors(multipleErrors);
    }

    return { results: results.filter(r => r !== undefined), errors };
  },
};