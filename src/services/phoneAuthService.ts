/**
 * 電話番号認証サービス
 * Supabase Auth を使用したSMS認証
 */

import { supabase } from '@/services/supabase';
import { Logger } from '@/utils/logger';

export interface PhoneAuthResponse {
  success: boolean;
  message: string;
  session?: any;
}

export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  user?: any;
}

class PhoneAuthService {
  /**
   * 電話番号にSMS認証コードを送信
   */
  async sendVerificationCode(phoneNumber: string): Promise<PhoneAuthResponse> {
    try {
      // 日本の電話番号フォーマットに変換
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      Logger.info('SMS認証コード送信開始', formattedPhone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        Logger.error('SMS認証コード送信エラー', error);
        return {
          success: false,
          message: this.getErrorMessage(error.message)
        };
      }

      Logger.success('SMS認証コード送信成功', formattedPhone);
      return {
        success: true,
        message: '認証コードを送信しました',
        session: data.session
      };

    } catch (error) {
      Logger.error('SMS認証コード送信失敗', error);
      return {
        success: false,
        message: '認証コードの送信に失敗しました'
      };
    }
  }

  /**
   * 認証コードを検証してサインイン
   */
  async verifyCode(phoneNumber: string, code: string): Promise<PhoneVerificationResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      Logger.info('認証コード検証開始', { phone: formattedPhone, code });
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms'
      });

      if (error) {
        Logger.error('認証コード検証エラー', error);
        return {
          success: false,
          message: this.getErrorMessage(error.message)
        };
      }

      if (!data.user) {
        Logger.error('認証コード検証失敗: ユーザーが見つかりません');
        return {
          success: false,
          message: '認証に失敗しました'
        };
      }

      Logger.success('認証コード検証成功', data.user.id);
      return {
        success: true,
        message: '認証が完了しました',
        user: data.user
      };

    } catch (error) {
      Logger.error('認証コード検証失敗', error);
      return {
        success: false,
        message: '認証コードの検証に失敗しました'
      };
    }
  }

  /**
   * 現在のセッションを取得
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        Logger.error('セッション取得エラー', error);
        return null;
      }

      return session;
    } catch (error) {
      Logger.error('セッション取得失敗', error);
      return null;
    }
  }

  /**
   * サインアウト
   */
  async signOut(): Promise<PhoneAuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Logger.error('サインアウトエラー', error);
        return {
          success: false,
          message: 'サインアウトに失敗しました'
        };
      }

      Logger.success('サインアウト成功');
      return {
        success: true,
        message: 'サインアウトしました'
      };

    } catch (error) {
      Logger.error('サインアウト失敗', error);
      return {
        success: false,
        message: 'サインアウトに失敗しました'
      };
    }
  }

  /**
   * 電話番号をE.164形式にフォーマット
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 数字のみ抽出
    const digits = phoneNumber.replace(/\D/g, '');
    
    // 日本の電話番号の場合
    if (digits.startsWith('81')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return `+81${digits.slice(1)}`;
    } else {
      return `+81${digits}`;
    }
  }

  /**
   * エラーメッセージを日本語に変換
   */
  private getErrorMessage(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid phone number': '電話番号が正しくありません',
      'Phone number already exists': 'この電話番号は既に登録されています',
      'Invalid verification code': '認証コードが正しくありません',
      'Verification code expired': '認証コードの有効期限が切れています',
      'Too many requests': 'リクエストが多すぎます。しばらく待ってからお試しください',
      'Rate limit exceeded': '制限を超えました。しばらく待ってからお試しください'
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    return '認証に失敗しました。もう一度お試しください';
  }

  /**
   * 電話番号のバリデーション
   */
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; message: string } {
    const digits = phoneNumber.replace(/\D/g, '');
    
    // 日本の携帯電話番号の形式チェック
    if (digits.length === 11 && digits.startsWith('0')) {
      // 080, 090, 070 から始まる11桁
      if (digits.startsWith('080') || digits.startsWith('090') || digits.startsWith('070')) {
        return { isValid: true, message: '' };
      }
    }
    
    // 国際形式（+81）の場合
    if (digits.length === 12 && digits.startsWith('81')) {
      const japanNumber = digits.slice(2);
      if (japanNumber.startsWith('80') || japanNumber.startsWith('90') || japanNumber.startsWith('70')) {
        return { isValid: true, message: '' };
      }
    }

    return { 
      isValid: false, 
      message: '日本の携帯電話番号を入力してください（例: 090-1234-5678）' 
    };
  }
}

export const phoneAuthService = new PhoneAuthService();