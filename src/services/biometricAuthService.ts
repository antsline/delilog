/**
 * 生体認証サービス
 * SMS認証の代替として生体認証を使用
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Logger } from '@/utils/logger';

export interface BiometricAuthResult {
  success: boolean;
  message: string;
  biometricType?: LocalAuthentication.AuthenticationType[];
}

class BiometricAuthService {
  /**
   * 生体認証の利用可否をチェック
   */
  async isBiometricAvailable(): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isAvailable) {
        return {
          success: false,
          message: 'この端末は生体認証に対応していません'
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          success: false,
          message: '生体認証が設定されていません。端末の設定で生体認証を有効にしてください'
        };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      Logger.info('生体認証利用可能', { supportedTypes });
      
      return {
        success: true,
        message: '生体認証が利用可能です',
        biometricType: supportedTypes
      };
    } catch (error) {
      Logger.error('生体認証チェック失敗', error);
      return {
        success: false,
        message: '生体認証のチェックに失敗しました'
      };
    }
  }

  /**
   * 生体認証を実行
   */
  async authenticate(reason: string = 'アプリにログインするために認証が必要です'): Promise<BiometricAuthResult> {
    try {
      // 生体認証の利用可否チェック
      const availability = await this.isBiometricAvailable();
      if (!availability.success) {
        return availability;
      }

      // 生体認証を実行
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'キャンセル',
        fallbackLabel: '', // フォールバックを無効化
        disableDeviceFallback: true, // パスコードでの認証を無効化（純粋な生体認証のみ）
      });

      if (result.success) {
        Logger.success('生体認証成功');
        return {
          success: true,
          message: '認証が完了しました',
          biometricType: availability.biometricType
        };
      } else {
        Logger.info('生体認証失敗', result.error);
        return {
          success: false,
          message: result.error === 'user_cancel' ? '認証がキャンセルされました' : '認証に失敗しました'
        };
      }
    } catch (error) {
      Logger.error('生体認証実行エラー', error);
      return {
        success: false,
        message: '認証処理でエラーが発生しました'
      };
    }
  }

  /**
   * 生体認証タイプの日本語名を取得
   */
  getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
    const typeNames: { [key: number]: string } = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: '指紋認証',
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: '顔認証',
      [LocalAuthentication.AuthenticationType.IRIS]: '虹彩認証',
    };

    const names = types.map(type => typeNames[type]).filter(Boolean);
    return names.length > 0 ? names.join('・') : '生体認証';
  }
}

export const biometricAuthService = new BiometricAuthService();