/**
 * 認証セッション管理サービス
 * SMS認証の回数制限とセッション延長を管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@/utils/logger';
import { biometricAuthService } from './biometricAuthService';
import { supabase } from './supabase';

export interface AuthSessionInfo {
  lastSMSAuth: number;
  smsAuthCount: number;
  biometricEnabled: boolean;
  sessionExtendedUntil: number;
  // Supabaseセッション情報の保存
  supabaseSession?: {
    access_token: string;
    refresh_token: string;
    user_id: string;
    expires_at?: number;
  };
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
        Logger.info('保存されたセッション情報なし - デフォルト作成');
        return this.createDefaultSession();
      }

      const session: AuthSessionInfo = JSON.parse(stored);
      const validatedSession = this.validateSession(session);
      Logger.info('セッション情報取得完了', {
        biometricEnabled: validatedSession.biometricEnabled,
        hasSupabaseSession: !!validatedSession.supabaseSession,
        sessionExtendedUntil: validatedSession.sessionExtendedUntil
      });
      return validatedSession;
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
      Logger.info('生体認証有効化開始');
      const biometricCheck = await biometricAuthService.isBiometricAvailable();
      Logger.info('生体認証デバイスチェック完了', biometricCheck);
      if (!biometricCheck.success) {
        return biometricCheck;
      }

      // 現在のSupabaseセッションを取得
      Logger.info('Supabaseセッション取得開始');
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      Logger.info('Supabaseセッション取得結果', { 
        hasSession: !!currentSession.session, 
        error: sessionError?.message,
        userId: currentSession.session?.user?.id 
      });
      
      if (sessionError) {
        Logger.error('Supabaseセッション取得エラー', sessionError);
        return {
          success: false,
          message: 'セッション取得エラーが発生しました'
        };
      }
      
      if (!currentSession.session) {
        Logger.warn('アクティブなセッションが見つかりません');
        return {
          success: false,
          message: 'アクティブなセッションが見つかりません'
        };
      }

      // 現在のセッションをそのまま使用（リフレッシュで画面遷移が発生するのを防ぐ）
      Logger.info('現在のセッションを使用（リフレッシュをスキップ）');
      const sessionToSave = currentSession.session;

      Logger.info('現在のセッション情報取得開始');
      const session = await this.getSessionInfo();
      Logger.info('現在のセッション情報取得完了');
      
      session.biometricEnabled = true;
      session.sessionExtendedUntil = Date.now() + (this.SESSION_EXTEND_HOURS * 60 * 60 * 1000);
      
      // Supabaseセッション情報を保存（可能な限り新しいトークンを使用）
      Logger.info('Supabaseセッション情報設定開始');
      session.supabaseSession = {
        access_token: sessionToSave.access_token,
        refresh_token: sessionToSave.refresh_token,
        user_id: sessionToSave.user.id,
        expires_at: sessionToSave.expires_at
      };
      Logger.info('Supabaseセッション情報設定完了');
      
      Logger.info('セッション保存開始（enableBiometricAuth）');
      await this.saveSession(session);

      Logger.success('生体認証有効化', { 
        userId: currentSession.session.user.id,
        biometricEnabled: session.biometricEnabled,
        hasSupabaseSession: !!session.supabaseSession,
        sessionExtendedUntil: session.sessionExtendedUntil
      });
      return {
        success: true,
        message: '✅ 生体認証の設定が完了しました。\n次回からはSMS認証なしでログインできます。'
      };
    } catch (error) {
      Logger.error('生体認証有効化エラー', error);
      return {
        success: false,
        message: `生体認証の有効化に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
   * 保存されたSupabaseセッションを復元
   */
  async restoreSupabaseSession(): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.getSessionInfo();
      Logger.info('セッション復元開始', { 
        biometricEnabled: session.biometricEnabled,
        hasSupabaseSession: !!session.supabaseSession,
        sessionExtendedUntil: session.sessionExtendedUntil
      });
      
      if (!session.biometricEnabled || !session.supabaseSession) {
        Logger.warn('保存されたセッションが見つかりません', {
          biometricEnabled: session.biometricEnabled,
          hasSupabaseSession: !!session.supabaseSession
        });
        return {
          success: false,
          message: '保存されたセッションが見つかりません'
        };
      }

      // セッションの有効期限をチェック
      const isValid = await this.isSessionValid();
      Logger.info('セッション有効性チェック', { isValid });
      if (!isValid) {
        return {
          success: false,
          message: 'セッションの有効期限が切れています'
        };
      }

      Logger.info('セッション復元試行開始', {
        hasAccessToken: !!session.supabaseSession.access_token,
        hasRefreshToken: !!session.supabaseSession.refresh_token,
        userId: session.supabaseSession.user_id
      });

      // タイムアウト付きでセッション復元を実行
      const restorePromise = this.performSessionRestore(session.supabaseSession);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('セッション復元がタイムアウトしました')), 10000);
      });

      try {
        await Promise.race([restorePromise, timeoutPromise]);
        Logger.info('セッション復元処理完了');
      } catch (error) {
        Logger.error('セッション復元処理失敗', error);
        return {
          success: false,
          message: 'セッションの復元に失敗しました。SMS認証をやり直してください。'
        };
      }


      // セッションを延長
      session.sessionExtendedUntil = Date.now() + (this.SESSION_EXTEND_HOURS * 60 * 60 * 1000);
      await this.saveSession(session);

      // 復元後のセッション状態を確認
      const { data: verifySession } = await supabase.auth.getSession();
      Logger.success('Supabaseセッション復元完了', { 
        userId: session.supabaseSession.user_id,
        hasSession: !!verifySession.session,
        sessionUserId: verifySession.session?.user?.id
      });
      
      if (!verifySession.session) {
        Logger.error('セッション復元後の確認で、セッションが見つかりません');
        return {
          success: false,
          message: 'セッション復元に失敗しました'
        };
      }

      return {
        success: true,
        message: 'セッションが復元されました'
      };
    } catch (error) {
      Logger.error('セッション復元エラー', error);
      return {
        success: false,
        message: 'セッション復元でエラーが発生しました'
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

  /**
   * SMS認証カウントをリセット（開発・デバッグ用）
   */
  async resetSMSCount(): Promise<void> {
    try {
      const session = await this.getSessionInfo();
      session.smsAuthCount = 0;
      session.lastSMSAuth = 0;
      await this.saveSession(session);
      Logger.info('SMS認証カウントをリセット');
    } catch (error) {
      Logger.error('SMS認証カウントリセットエラー', error);
    }
  }

  /**
   * 生体認証を無効化（開発・デバッグ用）
   */
  async disableBiometricAuth(): Promise<void> {
    try {
      const session = await this.getSessionInfo();
      session.biometricEnabled = false;
      session.supabaseSession = undefined;
      session.sessionExtendedUntil = 0;
      await this.saveSession(session);
      Logger.info('生体認証を無効化');
    } catch (error) {
      Logger.error('生体認証無効化エラー', error);
    }
  }

  /**
   * 実際のセッション復元処理（タイムアウト対応版）
   */
  private async performSessionRestore(supabaseSession: AuthSessionInfo['supabaseSession']): Promise<void> {
    if (!supabaseSession) {
      throw new Error('Supabaseセッション情報がありません');
    }

    Logger.info('Supabaseセッション復元開始', {
      hasAccessToken: !!supabaseSession.access_token,
      hasRefreshToken: !!supabaseSession.refresh_token,
      userId: supabaseSession.user_id,
      expiresAt: supabaseSession.expires_at
    });

    // セッションを復元
    const { data, error } = await supabase.auth.setSession({
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
    });

    if (error) {
      Logger.error('Supabaseセッション復元エラー', error);
      throw new Error(`セッション復元エラー: ${error.message}`);
    }

    if (!data.session) {
      Logger.error('セッション復元後にセッションが取得できませんでした');
      throw new Error('セッション復元に失敗しました');
    }

    Logger.success('Supabaseセッション復元成功', {
      userId: data.session.user.id,
      expiresAt: data.session.expires_at
    });
  }

  // Private methods

  private createDefaultSession(): AuthSessionInfo {
    return {
      lastSMSAuth: 0,
      smsAuthCount: 0,
      biometricEnabled: false,
      sessionExtendedUntil: 0,
      supabaseSession: undefined
    };
  }

  private validateSession(session: AuthSessionInfo): AuthSessionInfo {
    // 必要に応じてセッション情報の検証・修正
    return {
      lastSMSAuth: session.lastSMSAuth || 0,
      smsAuthCount: session.smsAuthCount || 0,
      biometricEnabled: session.biometricEnabled || false,
      sessionExtendedUntil: session.sessionExtendedUntil || 0,
      supabaseSession: session.supabaseSession
    };
  }

  private async saveSession(session: AuthSessionInfo): Promise<void> {
    try {
      Logger.info('セッション保存開始', {
        biometricEnabled: session.biometricEnabled,
        hasSupabaseSession: !!session.supabaseSession,
        sessionExtendedUntil: session.sessionExtendedUntil
      });
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      Logger.success('セッション保存完了');
    } catch (error) {
      Logger.error('セッション保存エラー', error);
      throw error;
    }
  }
}

export const authSessionService = new AuthSessionService();