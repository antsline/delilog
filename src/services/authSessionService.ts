/**
 * 認証セッション管理サービス
 * SMS認証の回数制限とセッション延長を管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@/utils/logger';
import { biometricAuthService } from './biometricAuthService';

export interface AuthSessionInfo {
  lastSMSAuth: number;
  smsAuthCount: number;
  biometricEnabled: boolean;
  sessionExtendedUntil: number;
}

class AuthSessionService {
  private readonly STORAGE_KEY = 'delilog_auth_session';
  private readonly SMS_LIMIT_PER_DAY = 3; // 1日3回まで
  private readonly SESSION_EXTEND_HOURS = 24 * 7; // 1週間延長

  /**
   * 認証セッション情報を取得
   */
  async getSessionInfo(): Promise<AuthSessionInfo> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createDefaultSession();
      }

      const session: AuthSessionInfo = JSON.parse(stored);
      return this.validateSession(session);
    } catch (error) {
      Logger.error('セッション情報取得エラー', error);
      return this.createDefaultSession();
    }
  }

  /**
   * SMS認証実行前のチェック
   */
  async canUseSMSAuth(): Promise<{ allowed: boolean; message: string; remainingCount: number }> {
    const session = await this.getSessionInfo();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSMSDate = new Date(session.lastSMSAuth);
    const lastSMSStart = new Date(lastSMSDate.getFullYear(), lastSMSDate.getMonth(), lastSMSDate.getDate());

    // 日付が変わっている場合はカウントリセット
    if (todayStart.getTime() !== lastSMSStart.getTime()) {
      session.smsAuthCount = 0;
    }

    const remainingCount = Math.max(0, this.SMS_LIMIT_PER_DAY - session.smsAuthCount);

    if (session.smsAuthCount >= this.SMS_LIMIT_PER_DAY) {
      return {
        allowed: false,
        message: `SMS認証は1日${this.SMS_LIMIT_PER_DAY}回までです。生体認証をご利用ください。`,
        remainingCount: 0
      };
    }

    return {
      allowed: true,
      message: `SMS認証が利用できます（残り${remainingCount}回）`,
      remainingCount
    };
  }

  /**
   * SMS認証実行後の記録
   */
  async recordSMSAuth(): Promise<void> {
    try {
      const session = await this.getSessionInfo();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastSMSDate = new Date(session.lastSMSAuth);
      const lastSMSStart = new Date(lastSMSDate.getFullYear(), lastSMSDate.getMonth(), lastSMSDate.getDate());

      // 日付が変わっている場合はカウントリセット
      if (todayStart.getTime() !== lastSMSStart.getTime()) {
        session.smsAuthCount = 1;
      } else {
        session.smsAuthCount += 1;
      }

      session.lastSMSAuth = Date.now();
      await this.saveSession(session);
      
      Logger.info('SMS認証記録完了', { count: session.smsAuthCount });
    } catch (error) {
      Logger.error('SMS認証記録エラー', error);
    }
  }

  /**
   * 生体認証を有効化
   */
  async enableBiometricAuth(): Promise<{ success: boolean; message: string }> {
    try {
      const biometricCheck = await biometricAuthService.isBiometricAvailable();
      if (!biometricCheck.success) {
        return biometricCheck;
      }

      const session = await this.getSessionInfo();
      session.biometricEnabled = true;
      session.sessionExtendedUntil = Date.now() + (this.SESSION_EXTEND_HOURS * 60 * 60 * 1000);
      await this.saveSession(session);

      Logger.success('生体認証有効化');
      return {
        success: true,
        message: '生体認証が有効になりました。次回からはSMS認証なしでログインできます。'
      };
    } catch (error) {
      Logger.error('生体認証有効化エラー', error);
      return {
        success: false,
        message: '生体認証の有効化に失敗しました'
      };
    }
  }

  /**
   * セッション延長（生体認証は外部で実行済み）
   */
  async extendSessionWithBiometric(): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.getSessionInfo();
      if (!session.biometricEnabled) {
        return {
          success: false,
          message: '生体認証が有効化されていません'
        };
      }

      // セッションを延長
      session.sessionExtendedUntil = Date.now() + (this.SESSION_EXTEND_HOURS * 60 * 60 * 1000);
      await this.saveSession(session);

      Logger.success('セッション延長完了');
      return {
        success: true,
        message: 'セッションが延長されました'
      };
    } catch (error) {
      Logger.error('セッション延長エラー', error);
      return {
        success: false,
        message: 'セッション延長に失敗しました'
      };
    }
  }

  /**
   * セッションの有効性チェック
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getSessionInfo();
      return session.sessionExtendedUntil > Date.now();
    } catch (error) {
      Logger.error('セッション有効性チェックエラー', error);
      return false;
    }
  }

  /**
   * セッション情報をクリア
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      Logger.info('セッション情報クリア');
    } catch (error) {
      Logger.error('セッション情報クリアエラー', error);
    }
  }

  // Private methods

  private createDefaultSession(): AuthSessionInfo {
    return {
      lastSMSAuth: 0,
      smsAuthCount: 0,
      biometricEnabled: false,
      sessionExtendedUntil: 0
    };
  }

  private validateSession(session: AuthSessionInfo): AuthSessionInfo {
    // 必要に応じてセッション情報の検証・修正
    return {
      lastSMSAuth: session.lastSMSAuth || 0,
      smsAuthCount: session.smsAuthCount || 0,
      biometricEnabled: session.biometricEnabled || false,
      sessionExtendedUntil: session.sessionExtendedUntil || 0
    };
  }

  private async saveSession(session: AuthSessionInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      Logger.error('セッション保存エラー', error);
      throw error;
    }
  }
}

export const authSessionService = new AuthSessionService();