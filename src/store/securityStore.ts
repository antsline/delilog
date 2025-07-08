/**
 * セキュリティ設定状態管理
 * 生体認証、セキュリティ設定の状態を管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityService, SecuritySettings, BiometricAuthResult } from '@/services/securityService';
import * as LocalAuthentication from 'expo-local-authentication';

interface SecurityState {
  // セキュリティ設定
  settings: SecuritySettings;
  
  // 生体認証の状態
  biometricAvailable: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  biometricEnrolled: boolean;
  
  // UI状態
  isLoading: boolean;
  error: string | null;
  
  // 最後の認証時刻
  lastAuthenticatedAt: number | null;
  
  // セキュリティレベル
  securityLevel: 'low' | 'medium' | 'high';
}

interface SecurityActions {
  // 初期化
  initialize: () => Promise<void>;
  
  // 生体認証
  checkBiometricAvailability: () => Promise<void>;
  authenticateWithBiometrics: (promptMessage?: string) => Promise<BiometricAuthResult>;
  
  // セキュリティ設定
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  toggleBiometricAuth: () => Promise<void>;
  toggleAutoLock: () => Promise<void>;
  setAutoLockDelay: (minutes: number) => Promise<void>;
  
  // セキュリティ診断
  runSecurityDiagnosis: () => Promise<void>;
  
  // 認証状態管理
  markAsAuthenticated: () => void;
  isAuthenticationRequired: () => boolean;
  
  // エラー管理
  clearError: () => void;
  
  // データクリア
  clearAllSecurityData: () => Promise<void>;
}

type SecurityStore = SecurityState & SecurityActions;

export const useSecurityStore = create<SecurityStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      settings: {
        biometricEnabled: false,
        autoLockEnabled: false,
        autoLockDelay: 5,
        encryptionEnabled: true,
      },
      biometricAvailable: false,
      biometricTypes: [],
      biometricEnrolled: false,
      isLoading: false,
      error: null,
      lastAuthenticatedAt: null,
      securityLevel: 'low',

      // 初期化
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // セキュリティ設定を読み込み
          const settings = await securityService.getSecuritySettings();
          
          // 生体認証の利用可能性をチェック
          const biometricInfo = await securityService.checkBiometricAvailability();
          
          // セキュリティ診断を実行
          const diagnosis = await securityService.diagnoseSecurityStatus();
          
          set({
            settings,
            biometricAvailable: biometricInfo.available,
            biometricTypes: biometricInfo.types,
            biometricEnrolled: biometricInfo.enrolled,
            securityLevel: diagnosis.overallSecurityLevel,
            isLoading: false,
          });
          
          console.log('🔐 セキュリティストア初期化完了');
        } catch (error) {
          console.error('❌ セキュリティストア初期化エラー:', error);
          set({ 
            error: error instanceof Error ? error.message : 'セキュリティの初期化に失敗しました',
            isLoading: false,
          });
        }
      },

      // 生体認証利用可能性チェック
      checkBiometricAvailability: async () => {
        try {
          const biometricInfo = await securityService.checkBiometricAvailability();
          set({
            biometricAvailable: biometricInfo.available,
            biometricTypes: biometricInfo.types,
            biometricEnrolled: biometricInfo.enrolled,
          });
        } catch (error) {
          console.error('❌ 生体認証チェックエラー:', error);
          set({ error: '生体認証の確認に失敗しました' });
        }
      },

      // 生体認証実行
      authenticateWithBiometrics: async (promptMessage?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await securityService.authenticateWithBiometrics(promptMessage);
          
          if (result.success) {
            set({ 
              lastAuthenticatedAt: Date.now(),
              isLoading: false,
            });
          } else {
            set({ 
              error: result.error || '認証に失敗しました',
              isLoading: false,
            });
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '認証中にエラーが発生しました';
          set({ 
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // セキュリティ設定更新
      updateSecuritySettings: async (newSettings: Partial<SecuritySettings>) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentSettings = get().settings;
          const updatedSettings = { ...currentSettings, ...newSettings };
          
          await securityService.saveSecuritySettings(updatedSettings);
          
          // セキュリティ診断を再実行
          const diagnosis = await securityService.diagnoseSecurityStatus();
          
          set({ 
            settings: updatedSettings,
            securityLevel: diagnosis.overallSecurityLevel,
            isLoading: false,
          });
          
          console.log('✅ セキュリティ設定更新完了');
        } catch (error) {
          console.error('❌ セキュリティ設定更新エラー:', error);
          set({ 
            error: error instanceof Error ? error.message : 'セキュリティ設定の更新に失敗しました',
            isLoading: false,
          });
        }
      },

      // 生体認証ON/OFF切り替え
      toggleBiometricAuth: async () => {
        const currentSettings = get().settings;
        const biometricAvailable = get().biometricAvailable;
        
        if (!biometricAvailable && !currentSettings.biometricEnabled) {
          set({ error: '生体認証が利用できません' });
          return;
        }
        
        await get().updateSecuritySettings({
          biometricEnabled: !currentSettings.biometricEnabled,
        });
      },

      // 自動ロックON/OFF切り替え
      toggleAutoLock: async () => {
        const currentSettings = get().settings;
        await get().updateSecuritySettings({
          autoLockEnabled: !currentSettings.autoLockEnabled,
        });
      },

      // 自動ロック時間設定
      setAutoLockDelay: async (minutes: number) => {
        await get().updateSecuritySettings({
          autoLockDelay: minutes,
        });
      },

      // セキュリティ診断実行
      runSecurityDiagnosis: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const diagnosis = await securityService.diagnoseSecurityStatus();
          
          set({
            biometricAvailable: diagnosis.biometricAvailable,
            securityLevel: diagnosis.overallSecurityLevel,
            isLoading: false,
          });
          
          console.log('🔍 セキュリティ診断完了:', diagnosis);
        } catch (error) {
          console.error('❌ セキュリティ診断エラー:', error);
          set({ 
            error: 'セキュリティ診断に失敗しました',
            isLoading: false,
          });
        }
      },

      // 認証済みとしてマーク
      markAsAuthenticated: () => {
        set({ lastAuthenticatedAt: Date.now() });
      },

      // 認証が必要かチェック
      isAuthenticationRequired: () => {
        const { settings, lastAuthenticatedAt } = get();
        
        if (!settings.autoLockEnabled || !settings.biometricEnabled) {
          return false;
        }
        
        if (!lastAuthenticatedAt) {
          return true;
        }
        
        const autoLockDelayMs = settings.autoLockDelay * 60 * 1000; // 分をミリ秒に変換
        const timeSinceLastAuth = Date.now() - lastAuthenticatedAt;
        
        return timeSinceLastAuth > autoLockDelayMs;
      },

      // エラークリア
      clearError: () => {
        set({ error: null });
      },

      // 全セキュリティデータクリア
      clearAllSecurityData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await securityService.clearAllSecureData();
          
          // 状態をリセット
          set({
            settings: {
              biometricEnabled: false,
              autoLockEnabled: false,
              autoLockDelay: 5,
              encryptionEnabled: true,
            },
            lastAuthenticatedAt: null,
            securityLevel: 'low',
            isLoading: false,
          });
          
          console.log('🗑️ セキュリティデータクリア完了');
        } catch (error) {
          console.error('❌ セキュリティデータクリアエラー:', error);
          set({ 
            error: 'セキュリティデータのクリアに失敗しました',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // セキュリティ上の理由で一部のデータは永続化しない
      partialize: (state) => ({
        settings: state.settings,
        lastAuthenticatedAt: state.lastAuthenticatedAt,
      }),
    }
  )
);

// セキュリティストアのhooks
export const useSecuritySettings = () => useSecurityStore((state) => state.settings);
export const useBiometricAvailable = () => useSecurityStore((state) => state.biometricAvailable);
export const useSecurityLevel = () => useSecurityStore((state) => state.securityLevel);
export const useSecurityLoading = () => useSecurityStore((state) => state.isLoading);
export const useSecurityError = () => useSecurityStore((state) => state.error);