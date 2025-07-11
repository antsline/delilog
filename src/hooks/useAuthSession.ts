/**
 * 認証セッション管理フック
 * 生体認証とセッション状態を管理
 */

import { useState, useEffect } from 'react';
import { authSessionService } from '@/services/authSessionService';
import { biometricAuthService } from '@/services/biometricAuthService';
import { supabase } from '@/services/supabase';
import { Logger } from '@/utils/logger';

interface AuthSessionState {
  isSessionValid: boolean;
  biometricAvailable: boolean;
  smsLimitReached: boolean;
  remainingSMSCount: number;
  isLoading: boolean;
}

export const useAuthSession = () => {
  const [state, setState] = useState<AuthSessionState>({
    isSessionValid: false,
    biometricAvailable: false,
    smsLimitReached: false,
    remainingSMSCount: 3,
    isLoading: true,
  });

  // 初期化
  useEffect(() => {
    initializeAuthSession();
  }, []);

  // Supabaseセッション変更の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        Logger.info('Auth state changed', { event, hasSession: !!session });
        await checkAuthSession();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuthSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await checkAuthSession();
    } catch (error) {
      Logger.error('Auth session initialization error', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const checkAuthSession = async () => {
    try {
      // Supabaseセッションの確認
      const { data: { session } } = await supabase.auth.getSession();
      const hasSupabaseSession = !!session;

      // 独自セッションの確認
      const isValid = await authSessionService.isSessionValid();

      // 生体認証の確認
      const sessionInfo = await authSessionService.getSessionInfo();
      const biometricResult = await biometricAuthService.isBiometricAvailable();
      const biometricEnabled = sessionInfo.biometricEnabled && biometricResult.success;

      // SMS制限の確認
      const smsStatus = await authSessionService.canUseSMSAuth();

      setState(prev => ({
        ...prev,
        isSessionValid: hasSupabaseSession && isValid,
        biometricAvailable: biometricEnabled,
        smsLimitReached: !smsStatus.allowed,
        remainingSMSCount: smsStatus.remainingCount,
      }));

      Logger.info('Auth session status', {
        hasSupabaseSession,
        isValid,
        biometricEnabled,
        smsLimitReached: !smsStatus.allowed,
        remainingSMSCount: smsStatus.remainingCount,
      });
    } catch (error) {
      Logger.error('Auth session check error', error);
    }
  };

  const extendSession = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!state.biometricAvailable) {
        return {
          success: false,
          message: '生体認証が利用できません'
        };
      }

      const biometricResult = await biometricAuthService.authenticate(
        'セッションを延長するために認証が必要です'
      );

      if (!biometricResult.success) {
        return biometricResult;
      }

      const extendResult = await authSessionService.extendSessionWithBiometric();
      if (extendResult.success) {
        await checkAuthSession();
      }

      return extendResult;
    } catch (error) {
      Logger.error('Session extension error', error);
      return {
        success: false,
        message: 'セッション延長に失敗しました'
      };
    }
  };

  const enableBiometric = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await authSessionService.enableBiometricAuth();
      if (result.success) {
        await checkAuthSession();
      }
      return result;
    } catch (error) {
      Logger.error('Biometric enable error', error);
      return {
        success: false,
        message: '生体認証の有効化に失敗しました'
      };
    }
  };

  const clearSession = async (): Promise<void> => {
    try {
      await authSessionService.clearSession();
      await checkAuthSession();
    } catch (error) {
      Logger.error('Session clear error', error);
    }
  };

  return {
    ...state,
    refresh: checkAuthSession,
    extendSession,
    enableBiometric,
    clearSession,
  };
};