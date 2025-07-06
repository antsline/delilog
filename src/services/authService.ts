import { supabase } from './supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { UserProfile } from '@/types/database';

export class AuthService {
  // Apple認証
  static async signInWithApple() {
    try {
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

        if (error) throw error;
        return data;
      } else {
        throw new Error('Apple認証でトークンを取得できませんでした');
      }
    } catch (error) {
      console.error('Apple認証エラー:', error);
      throw error;
    }
  }

  // Google認証
  static async signInWithGoogle() {
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

      if (error) throw error;
      
      if (data.url) {
        // OAuth URLでブラウザを開く
        const result = await AuthSession.startAsync({
          authUrl: data.url,
        });

        if (result.type === 'success') {
          return data;
        } else {
          throw new Error('Google認証がキャンセルされました');
        }
      } else {
        throw new Error('Google認証URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Google認証エラー:', error);
      throw error;
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