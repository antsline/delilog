/**
 * ログ出力ユーティリティ
 * 本番環境でのログ制限とセキュリティ配慮
 */

// 開発環境判定
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export class Logger {
  /**
   * セキュリティ関連のログ出力
   */
  static security(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(`🔐 ${message}`, data ? data : '');
    }
  }

  /**
   * 一般的な情報ログ
   */
  static info(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data ? data : '');
    }
  }

  /**
   * 成功ログ
   */
  static success(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data ? data : '');
    }
  }

  /**
   * エラーログ（本番環境でも出力）
   */
  static error(message: string, error?: any): void {
    // エラーは本番環境でも記録（ただし詳細情報は制限）
    if (isDevelopment) {
      console.error(`❌ ${message}`, error);
    } else {
      // 本番環境では詳細なエラー情報を隠す
      console.error(`❌ ${message}`);
    }
  }

  /**
   * 警告ログ
   */
  static warn(message: string, data?: any): void {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data ? data : '');
    }
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  static debug(message: string, data?: any): void {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data ? data : '');
    }
  }

  /**
   * データ処理関連ログ
   */
  static data(message: string, count?: number): void {
    if (isDevelopment) {
      const countText = count !== undefined ? ` (${count}件)` : '';
      console.log(`📊 ${message}${countText}`);
    }
  }

  /**
   * ネットワーク関連ログ
   */
  static network(message: string, data?: any): void {
    if (isDevelopment) {
      console.log(`🌐 ${message}`, data ? data : '');
    }
  }

  /**
   * ファイル操作関連ログ
   */
  static file(message: string, path?: string): void {
    if (isDevelopment) {
      const pathText = path ? ` (${path})` : '';
      console.log(`📁 ${message}${pathText}`);
    }
  }

  /**
   * 認証関連ログ
   */
  static auth(message: string, userId?: string): void {
    if (isDevelopment) {
      // 本番環境では個人識別情報をログに残さない
      const userText = userId ? ` (User: ${userId.substring(0, 8)}...)` : '';
      console.log(`🔑 ${message}${userText}`);
    }
  }

  /**
   * パフォーマンス関連ログ
   */
  static performance(message: string, duration?: number): void {
    if (isDevelopment) {
      const durationText = duration !== undefined ? ` (${duration}ms)` : '';
      console.log(`⚡ ${message}${durationText}`);
    }
  }

  /**
   * 重要な本番ログ（本番環境でも出力）
   */
  static production(message: string): void {
    console.log(`📋 ${message}`);
  }
}

// 従来のconsole.logの置き換え用ヘルパー
export const secureLog = Logger.security;
export const infoLog = Logger.info;
export const successLog = Logger.success;
export const errorLog = Logger.error;
export const warnLog = Logger.warn;
export const debugLog = Logger.debug;