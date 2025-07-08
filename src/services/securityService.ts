/**
 * セキュリティサービス
 * 生体認証、セキュアストレージ、暗号化機能を提供
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as CryptoESModule from 'crypto-es';

// Handle different module loading scenarios
const getCryptoES = (): any => {
  // Try default export first
  if ((CryptoESModule as any).default) {
    return (CryptoESModule as any).default;
  }
  
  // Try direct module access
  if ((CryptoESModule as any).AES) {
    return CryptoESModule as any;
  }
  
  // Try require as fallback
  try {
    const crypto = require('crypto-es');
    return crypto.default || crypto;
  } catch (e) {
    console.error('Failed to load crypto-es module:', e);
    return null;
  }
};

const CryptoES: any = getCryptoES();
import { Platform } from 'react-native';
import { Logger } from '../utils/logger';

// Check if crypto-es is available without throwing error
const isCryptoESAvailable = (): boolean => {
  try {
    return !!(CryptoES && 
             CryptoES.AES && 
             CryptoES.mode && 
             CryptoES.mode.CBC && 
             CryptoES.pad && 
             CryptoES.pad.Pkcs7 && 
             CryptoES.lib && 
             CryptoES.lib.WordArray && 
             CryptoES.enc && 
             CryptoES.enc.Base64 && 
             CryptoES.enc.Utf8);
  } catch (error) {
    console.error('Error checking crypto-es availability:', error);
    return false;
  }
};

// Validate crypto-es module is properly loaded
const validateCryptoES = (): void => {
  if (!CryptoES) {
    throw new Error('crypto-es module is not loaded. Please check the module installation.');
  }
  if (!CryptoES.AES) {
    throw new Error('crypto-es AES module is not available. Module may be corrupted.');
  }
  if (!CryptoES.mode || !CryptoES.mode.CBC) {
    throw new Error('crypto-es CBC mode is not available. Required for secure encryption.');
  }
  if (!CryptoES.pad || !CryptoES.pad.Pkcs7) {
    throw new Error('crypto-es padding is not available. Required for CBC mode.');
  }
  if (!CryptoES.lib || !CryptoES.lib.WordArray) {
    throw new Error('crypto-es WordArray is not available. Required for IV generation.');
  }
  if (!CryptoES.enc || !CryptoES.enc.Base64 || !CryptoES.enc.Utf8) {
    throw new Error('crypto-es encoding modules are not available. Required for data conversion.');
  }
};

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: LocalAuthentication.AuthenticationType;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockDelay: number; // 分単位
  encryptionEnabled: boolean;
}

class SecurityService {
  private readonly SECURITY_SETTINGS_KEY = 'security_settings';
  private readonly ENCRYPTION_KEY = 'encryption_key_v1';

  /**
   * 生体認証の利用可能性をチェック
   */
  async checkBiometricAvailability(): Promise<{
    available: boolean;
    types: LocalAuthentication.AuthenticationType[];
    enrolled: boolean;
  }> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      Logger.security('生体認証状況確認完了', {
        compatible,
        enrolled,
        types: types.map(type => LocalAuthentication.AuthenticationType[type]),
      });

      return {
        available: compatible && enrolled,
        types,
        enrolled,
      };
    } catch (error) {
      console.error('❌ 生体認証チェックエラー:', error);
      return {
        available: false,
        types: [],
        enrolled: false,
      };
    }
  }

  /**
   * 生体認証を実行
   */
  async authenticateWithBiometrics(
    promptMessage: string = 'アプリにアクセスするために認証してください'
  ): Promise<BiometricAuthResult> {
    try {
      const { available, types } = await this.checkBiometricAvailability();
      
      if (!available) {
        return {
          success: false,
          error: '生体認証が利用できません。設定で生体認証を有効にしてください。',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'キャンセル',
        fallbackLabel: 'パスコードを使用',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Logger.success('生体認証成功');
        return {
          success: true,
          biometryType: types[0],
        };
      } else {
        const error = (result as any).error;
        Logger.warn('生体認証失敗', error);
        return {
          success: false,
          error: this.getBiometricErrorMessage(error),
        };
      }
    } catch (error) {
      console.error('❌ 生体認証実行エラー:', error);
      return {
        success: false,
        error: '認証中にエラーが発生しました',
      };
    }
  }

  /**
   * 生体認証エラーメッセージの変換
   */
  private getBiometricErrorMessage(error: string): string {
    switch (error) {
      case 'UserCancel':
        return 'ユーザーによってキャンセルされました';
      case 'UserFallback':
        return 'パスコード認証が選択されました';
      case 'SystemCancel':
        return 'システムによってキャンセルされました';
      case 'PasscodeNotSet':
        return 'パスコードが設定されていません';
      case 'BiometryNotAvailable':
        return '生体認証が利用できません';
      case 'BiometryNotEnrolled':
        return '生体認証が登録されていません';
      case 'BiometryLockout':
        return '生体認証がロックされています';
      default:
        return '認証に失敗しました';
    }
  }

  /**
   * セキュアストレージにデータを保存
   */
  async secureStoreSet(key: string, value: string, options?: SecureStore.SecureStoreOptions): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false, // 必要に応じて変更
        authenticationPrompt: 'データにアクセスするために認証してください',
        ...options,
      });
      Logger.security('セキュアストレージ保存完了', key);
    } catch (error) {
      console.error('❌ セキュアストレージ保存エラー:', error);
      throw new Error('セキュアな保存に失敗しました');
    }
  }

  /**
   * セキュアストレージからデータを取得
   */
  async secureStoreGet(key: string, options?: SecureStore.SecureStoreOptions): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key, options);
      if (value) {
        console.log('🔓 セキュアストレージ取得完了:', key);
      }
      return value;
    } catch (error) {
      console.error('❌ セキュアストレージ取得エラー:', error);
      return null;
    }
  }

  /**
   * セキュアストレージからデータを削除
   */
  async secureStoreDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log('🗑️ セキュアストレージ削除完了:', key);
    } catch (error) {
      console.error('❌ セキュアストレージ削除エラー:', error);
      throw new Error('セキュアな削除に失敗しました');
    }
  }

  /**
   * 暗号化キーを取得または生成
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    let encryptionKey = await this.secureStoreGet(this.ENCRYPTION_KEY);
    
    if (!encryptionKey) {
      // 新しい暗号化キーを生成（256ビット）
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      encryptionKey = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      await this.secureStoreSet(this.ENCRYPTION_KEY, encryptionKey);
      Logger.security('新しい暗号化キーを生成しました');
    }
    
    return encryptionKey;
  }

  /**
   * データを暗号化（AES-256-CBC使用）
   */
  async encryptData(data: string): Promise<string> {
    try {
      // crypto-es モジュールの利用可能性をチェック
      if (!isCryptoESAvailable()) {
        throw new Error('crypto-es module is not available for encryption');
      }
      
      // crypto-es モジュールの検証
      validateCryptoES();
      
      // 暗号化キーを取得
      const encryptionKey = await this.getOrCreateEncryptionKey();
      
      // ランダムIV（初期化ベクター）を生成
      const iv = CryptoES.lib.WordArray.random(16); // CBCモード用に16バイト
      
      // AES-256-CBCで暗号化
      const encrypted = CryptoES.AES.encrypt(data, encryptionKey, {
        iv: iv,
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7
      });
      
      // IV + 暗号化データを結合してBase64エンコード
      const result = iv.toString(CryptoES.enc.Base64) + ':' + encrypted.toString();
      
      Logger.security('データ暗号化完了（AES-256-CBC）');
      return result;
    } catch (error) {
      console.error('❌ データ暗号化エラー:', error);
      throw new Error('データの暗号化に失敗しました');
    }
  }

  /**
   * データを復号化（AES-256-CBC使用）
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      // crypto-es モジュールの利用可能性をチェック
      if (!isCryptoESAvailable()) {
        throw new Error('crypto-es module is not available for decryption');
      }
      
      // crypto-es モジュールの検証
      validateCryptoES();
      
      const encryptionKey = await this.secureStoreGet(this.ENCRYPTION_KEY);
      
      if (!encryptionKey) {
        throw new Error('暗号化キーが見つかりません');
      }

      // IV + 暗号化データを分離
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('無効な暗号化データ形式');
      }

      const [ivBase64, encryptedBase64] = parts;
      
      // IVを復元
      const iv = CryptoES.enc.Base64.parse(ivBase64);
      
      // AES-256-CBCで復号化
      const decrypted = CryptoES.AES.decrypt(encryptedBase64, encryptionKey, {
        iv: iv,
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7
      });
      
      // UTF-8文字列に変換
      const decryptedText = decrypted.toString(CryptoES.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('復号化に失敗しました（データが破損している可能性があります）');
      }
      
      Logger.security('データ復号化完了（AES-256-CBC）');
      return decryptedText;
    } catch (error) {
      console.error('❌ データ復号化エラー:', error);
      throw new Error('データの復号化に失敗しました');
    }
  }

  /**
   * セキュリティ設定を保存
   */
  async saveSecuritySettings(settings: SecuritySettings): Promise<void> {
    try {
      const encrypted = await this.encryptData(JSON.stringify(settings));
      await this.secureStoreSet(this.SECURITY_SETTINGS_KEY, encrypted);
      console.log('✅ セキュリティ設定保存完了');
    } catch (error) {
      console.error('❌ セキュリティ設定保存エラー:', error);
      throw error;
    }
  }

  /**
   * セキュリティ設定を取得
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const encrypted = await this.secureStoreGet(this.SECURITY_SETTINGS_KEY);
      
      if (!encrypted) {
        // デフォルト設定を返す
        const defaultSettings: SecuritySettings = {
          biometricEnabled: false,
          autoLockEnabled: false,
          autoLockDelay: 5,
          encryptionEnabled: true,
        };
        return defaultSettings;
      }

      const decrypted = await this.decryptData(encrypted);
      const settings: SecuritySettings = JSON.parse(decrypted);
      
      console.log('✅ セキュリティ設定取得完了');
      return settings;
    } catch (error) {
      console.error('❌ セキュリティ設定取得エラー:', error);
      // エラー時はデフォルト設定を返す
      return {
        biometricEnabled: false,
        autoLockEnabled: false,
        autoLockDelay: 5,
        encryptionEnabled: true,
      };
    }
  }

  /**
   * すべてのセキュアデータを削除
   */
  async clearAllSecureData(): Promise<void> {
    try {
      await this.secureStoreDelete(this.SECURITY_SETTINGS_KEY);
      await this.secureStoreDelete(this.ENCRYPTION_KEY);
      console.log('🗑️ すべてのセキュアデータを削除しました');
    } catch (error) {
      console.error('❌ セキュアデータ削除エラー:', error);
      throw new Error('セキュアデータの削除に失敗しました');
    }
  }

  /**
   * 暗号化機能の利用可能性をチェック
   */
  isCryptoAvailable(): boolean {
    return isCryptoESAvailable();
  }

  /**
   * セキュリティ状態の診断
   */
  async diagnoseSecurityStatus(): Promise<{
    biometricAvailable: boolean;
    biometricEnabled: boolean;
    encryptionWorking: boolean;
    secureStoreWorking: boolean;
    overallSecurityLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      const biometricInfo = await this.checkBiometricAvailability();
      const settings = await this.getSecuritySettings();
      
      // 暗号化機能テスト
      let encryptionWorking = false;
      try {
        // crypto-es モジュールの利用可能性をチェック
        if (!isCryptoESAvailable()) {
          console.error('❌ crypto-es モジュールが利用できません');
          throw new Error('crypto-es module is not available');
        }
        
        // crypto-es モジュールの検証
        validateCryptoES();
        
        const testData = 'test_encryption_data_日本語テスト123';
        const encrypted = await this.encryptData(testData);
        const decrypted = await this.decryptData(encrypted);
        encryptionWorking = decrypted === testData;
        console.log('🧪 暗号化テスト結果:', encryptionWorking);
      } catch (error) {
        console.error('❌ 暗号化テストエラー:', error);
        if (error instanceof Error) {
          console.error('❌ エラー詳細:', error.message);
        }
        encryptionWorking = false;
      }

      // セキュアストレージテスト
      let secureStoreWorking = false;
      try {
        const testKey = 'test_secure_store';
        const testValue = 'test_value';
        await this.secureStoreSet(testKey, testValue);
        const retrieved = await this.secureStoreGet(testKey);
        await this.secureStoreDelete(testKey);
        secureStoreWorking = retrieved === testValue;
      } catch {
        secureStoreWorking = false;
      }

      // セキュリティレベル判定
      let overallSecurityLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (encryptionWorking && secureStoreWorking) {
        if (biometricInfo.available && settings.biometricEnabled) {
          overallSecurityLevel = 'high';
        } else {
          overallSecurityLevel = 'medium';
        }
      }

      const diagnosis = {
        biometricAvailable: biometricInfo.available,
        biometricEnabled: settings.biometricEnabled,
        encryptionWorking,
        secureStoreWorking,
        overallSecurityLevel,
      };

      console.log('🔍 セキュリティ診断結果:', diagnosis);
      return diagnosis;
    } catch (error) {
      console.error('❌ セキュリティ診断エラー:', error);
      return {
        biometricAvailable: false,
        biometricEnabled: false,
        encryptionWorking: false,
        secureStoreWorking: false,
        overallSecurityLevel: 'low',
      };
    }
  }
}

// シングルトンインスタンス
export const securityService = new SecurityService();