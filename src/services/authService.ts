import { supabase } from './supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { UserProfile } from '@/types/database';
import { ErrorHandler } from '@/utils/errorHandler';
import { AppError, ErrorCode } from '@/types/error';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';

export class AuthService {
  // Apple認証
  static async signInWithApple(): Promise<{ user: any; session: any }> {
    try {
      // Apple認証の利用可能性チェック
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw {
          code: 'unavailable',
          message: 'Apple ID authentication is not available on this device',
        };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          throw ErrorHandler.handleSupabaseError(error, 'Apple authentication');
        }

        if (!data.user || !data.session) {
          throw {
            code: 'auth_failed',
            message: 'Apple authentication succeeded but failed to create session',
          };
        }

        return data;
      } else {
        throw {
          code: 'token_missing',
          message: 'Apple authentication succeeded but no identity token received',
        };
      }
    } catch (error: any) {
      console.error('Apple認証エラー:', error);
      
      // Apple特有のエラーコード処理
      if (error.code === 'ERR_REQUEST_CANCELED' || error.code === '1001') {
        throw ErrorHandler.handleAuthError({
          code: '1001',
          message: 'User cancelled Apple authentication',
        }, 'apple', 'signInWithApple');
      }

      if (error.code === 'unavailable') {
        throw {
          code: ErrorCode.FEATURE_UNAVAILABLE,
          message: error.message,
          userMessage: OPERATION_ERROR_MESSAGES.login.apple.unavailable,
          severity: 'medium',
          recoverable: false,
          retryable: false,
        } as AppError;
      }

      // その他のApple認証エラー
      throw ErrorHandler.handleAuthError(error, 'apple', 'signInWithApple');
    }
  }

  // Google認証
  static async signInWithGoogle(): Promise<{ user: any; session: any; url?: string }> {
    try {
      // Supabase OAuth URLを使用
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            useProxy: true,
          }),
        },
      });

      if (error) {
        throw ErrorHandler.handleSupabaseError(error, 'Google OAuth URL generation');
      }
      
      if (!data.url) {
        throw {
          code: 'url_missing',
          message: 'Google OAuth URL generation succeeded but no URL received',
        };
      }

      // OAuth URLでブラウザを開く
      const result = await AuthSession.startAsync({
        authUrl: data.url,
      });

      if (result.type === 'success') {
        // 認証成功後、セッション情報を取得
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw ErrorHandler.handleSupabaseError(sessionError, 'Google authentication session retrieval');
        }

        if (!sessionData.session) {
          throw {
            code: 'session_missing',
            message: 'Google authentication succeeded but no session created',
          };
        }

        return {
          user: sessionData.session.user,
          session: sessionData.session,
          url: data.url,
        };
      } else if (result.type === 'cancel') {
        throw ErrorHandler.handleAuthError({
          type: 'cancel',
          message: 'User cancelled Google authentication',
        }, 'google', 'signInWithGoogle');
      } else {
        throw {
          code: 'auth_failed',
          message: `Google authentication failed: ${result.type}`,
        };
      }
    } catch (error: any) {
      console.error('Google認証エラー:', error);
      
      // 既にAppErrorの場合はそのまま投げる
      if (error.code && error.userMessage) {
        throw error;
      }

      // その他のGoogle認証エラー
      throw ErrorHandler.handleAuthError(error, 'google', 'signInWithGoogle');
    }
  }

  // SMS認証（電話番号）
  static async signInWithPhone(phone: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SMS認証エラー:', error);
      throw error;
    }
  }

  // SMS認証コード確認
  static async verifyPhoneOtp(phone: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SMS認証コード確認エラー:', error);
      throw error;
    }
  }

  // ユーザープロフィールの作成
  static async createUserProfile(profileData: {
    companyName: string;
    driverName: string;
    plateNumber: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      // トランザクション的に実行（プロフィールと車両を同時作成）
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          id: user.id,
          company_name: profileData.companyName,
          driver_name: profileData.driverName,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // vehiclesテーブルに車両情報を作成
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          plate_number: profileData.plateNumber,
          is_default: true,
          is_active: true,
        })
        .select()
        .single();

      if (vehicleError) {
        // プロフィール作成後にエラーが発生した場合はプロフィールも削除
        await supabase.from('users_profile').delete().eq('id', user.id);
        throw vehicleError;
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('プロフィール作成エラー:', error);
      throw error;
    }
  }

  // ユーザープロフィールの取得
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
        throw error;
      }

      return data as UserProfile | null;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  }

  // ユーザープロフィールの更新
  static async updateUserProfile(profileData: {
    companyName: string;
    driverName: string;
    officeName?: string;
  }): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { data, error } = await supabase
        .from('users_profile')
        .update({
          company_name: profileData.companyName,
          driver_name: profileData.driverName,
          office_name: profileData.officeName || null,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data as UserProfile;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  }

  // テスト認証（開発用）
  static async signInWithTest() {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testtest123',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('テスト認証エラー:', error);
      throw error;
    }
  }

  // サインアウト
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('サインアウトエラー:', error);
      throw error;
    }
  }
}