import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { biometricAuthService } from '@/services/biometricAuthService';
import { authSessionService } from '@/services/authSessionService';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { user, hasProfile, loading: authLoading } = useAuth();
  
  // 開発環境チェック
  const isDevelopment = Constants.expoConfig?.extra?.appEnvironment === 'development' || 
                        process.env.EXPO_PUBLIC_APP_ENV === 'development';

  // 生体認証の利用可否をチェック
  React.useEffect(() => {
    const checkBiometric = async () => {
      // 生体認証が既に有効化されているかチェック
      const canUse = await AuthService.canUseBiometric();
      console.log('*** ログイン画面：生体認証チェック結果:', canUse);
      
      // 既に有効化されている場合はそのまま表示
      if (canUse.available) {
        console.log('*** 生体認証が有効化済み - ログインボタン表示');
        setBiometricAvailable(true);
        setBiometricEnabled(true);
        return;
      }
      
      // 有効化されていない場合でも、デバイスが生体認証をサポートしているかチェック
      const deviceSupport = await biometricAuthService.isBiometricAvailable();
      console.log('*** デバイス生体認証サポート:', deviceSupport);
      setBiometricAvailable(deviceSupport.success);
      setBiometricEnabled(false);
    };
    checkBiometric();
  }, []);

  // 認証状態の変更はindex.tsxで処理されるため、ここでは監視のみ
  React.useEffect(() => {
    if (user && hasProfile) {
      console.log('*** ログイン画面 - 既にログイン済み:', user.id, '(index.tsxで遷移処理)');
      // 遷移処理はindex.tsxに任せる
    }
  }, [user, hasProfile]);

  const handleAppleAuth = async () => {
    try {
      setLoading(true);
      await AuthService.signInWithApple();
      // 認証成功後の処理はuseAuthのuseEffectで自動的に処理される
    } catch (error) {
      console.error('Apple認証エラー:', error);
      Alert.alert(
        '認証エラー',
        'Apple認証に失敗しました。もう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await AuthService.signInWithGoogle();
      // 認証成功後の処理はuseAuthのuseEffectで自動的に処理される
    } catch (error) {
      console.error('Google認証エラー:', error);
      Alert.alert(
        '認証エラー',
        'Google認証に失敗しました。もう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSMSAuth = async () => {
    // SMS認証画面に遷移
    router.push('/phone-signin');
  };

  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      
      // 既に生体認証が設定されているかチェック
      const canUse = await AuthService.canUseBiometric();
      
      if (canUse.available) {
        // 既に設定済みの場合：ログインを実行
        const result = await AuthService.signInWithBiometric();
        
        if (result.success) {
          console.log('*** 生体認証ログイン成功 - index.tsxで再評価');
          router.replace('/');
        } else {
          Alert.alert(
            '認証エラー',
            result.message,
            [
              { text: 'OK' },
              ...(result.shouldPromptOtp ? [{ 
                text: 'SMS認証を実行', 
                onPress: () => router.push('/phone-signin') 
              }] : [])
            ]
          );
        }
      } else {
        // 未設定の場合：SMS認証画面に案内
        Alert.alert(
          '生体認証の設定',
          '生体認証を使用するには、まずSMS認証でログインして生体認証を有効化してください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { 
              text: 'SMS認証を実行', 
              onPress: () => router.push('/phone-signin') 
            }
          ]
        );
      }
    } catch (error) {
      console.error('生体認証エラー:', error);
      Alert.alert(
        '認証エラー',
        '生体認証の処理に失敗しました。もう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };


  const handleResetSMSLimit = async () => {
    try {
      await authSessionService.resetSMSCount();
      Alert.alert(
        'リセット完了',
        'SMS認証の上限回数がリセットされました。電話番号認証が再び利用できます。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('SMS制限リセットエラー:', error);
      Alert.alert('エラー', 'リセットに失敗しました');
    }
  };

  const handleDisableBiometric = async () => {
    try {
      await authSessionService.disableBiometricAuth();
      setBiometricAvailable(false);
      Alert.alert(
        '無効化完了',
        '生体認証が無効化されました。新しく設定し直すことができます。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('生体認証無効化エラー:', error);
      Alert.alert('エラー', '無効化に失敗しました');
    }
  };

  // 開発環境専用：認証をスキップしてログイン
  const handleDevSkipAuth = async () => {
    if (!isDevelopment) {
      Alert.alert('エラー', 'この機能は開発環境でのみ使用できます');
      return;
    }

    Alert.alert(
      '開発者用ログイン',
      '認証をスキップしてログインしますか？この機能は開発環境でのみ使用できます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログイン', 
          onPress: async () => {
            setLoading(true);
            try {
              // 開発環境用の固定ユーザーとしてログイン（存在しない場合は作成）
              let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: 'dev@delilog.app',
                password: 'delilog-dev-2024'
              });
              
              // ユーザーが存在しない場合は新規作成
              if (authError && authError.message === 'Invalid login credentials') {
                console.log('開発者アカウントが存在しないため、新規作成します');
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: 'dev@delilog.app',
                  password: 'delilog-dev-2024'
                });
                
                if (signUpError) {
                  throw signUpError;
                }
                
                authData = signUpData;
              } else if (authError) {
                throw authError;
              }

              if (authData.user) {
                console.log('認証成功、ユーザーID:', authData.user.id);
                
                // プロフィールが存在するかチェック
                const { data: profile, error: profileSelectError } = await supabase
                  .from('users_profile')
                  .select('*')
                  .eq('id', authData.user.id)
                  .single();

                console.log('プロフィール検索結果:', { profile, profileSelectError });

                if (profile) {
                  // プロフィールが存在する場合、メイン画面に遷移
                  console.log('既存プロフィール発見、メイン画面に遷移');
                  router.replace('/');
                } else {
                  // プロフィールが存在しない場合、開発用プロフィールを作成
                  console.log('プロフィールが存在しないため、開発用プロフィールを作成');
                  const { data: newProfile, error: profileError } = await supabase
                    .from('users_profile')
                    .insert({
                      id: authData.user.id,
                      company_name: '開発テスト会社',
                      driver_name: '開発テストドライバー',
                      office_name: '開発テスト営業所',
                      subscription_tier: 'basic',
                      subscription_status: 'active',
                    })
                    .select()
                    .single();

                  if (profileError) {
                    console.error('プロフィール作成エラー詳細:');
                    console.error('- message:', profileError.message);
                    console.error('- code:', profileError.code);
                    console.error('- details:', profileError.details);
                    console.error('- hint:', profileError.hint);
                    console.error('- full error:', profileError);
                    throw new Error(`プロフィール作成に失敗しました: ${profileError.message || profileError.code || 'Unknown error'}`);
                  }

                  console.log('プロフィール作成成功:', newProfile);

                  // デフォルト車両も作成
                  const { data: newVehicle, error: vehicleError } = await supabase
                    .from('vehicles')
                    .insert({
                      user_id: authData.user.id,
                      plate_number: '開発-1234',
                      vehicle_name: '開発テスト車両',
                      is_default: true,
                      is_active: true,
                    })
                    .select()
                    .single();

                  if (vehicleError) {
                    console.warn('車両作成エラー:', vehicleError);
                  } else {
                    console.log('車両作成成功:', newVehicle);
                  }

                  console.log('開発用アカウント設定完了、メイン画面に遷移');
                  router.replace('/');
                }
              }
            } catch (error) {
              console.error('開発者ログインエラー詳細:');
              console.error('- error:', error);
              console.error('- message:', error?.message);
              console.error('- stack:', error?.stack);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('エラー', `開発者ログインに失敗しました: ${errorMessage}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <View style={styles.header}>
        <Text style={styles.title}>delilog</Text>
        <Text style={styles.subtitle}>運送業点呼記録アプリ</Text>
        <Text style={styles.description}>
          法令遵守を最小限の手間で実現
        </Text>
      </View>

      <View style={styles.authSection}>
        <Text style={styles.authTitle}>ログイン・新規登録</Text>
        
        {biometricAvailable && (
          <TouchableOpacity
            style={[styles.authButton, styles.biometricButton, loading && styles.disabledButton]}
            onPress={handleBiometricAuth}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cream} size="small" />
            ) : (
              <>
                <FontAwesome5 name="fingerprint" size={20} color={colors.cream} solid style={styles.buttonIcon} />
                <Text style={styles.biometricButtonText}>
                  {biometricEnabled ? '生体認証でサインイン' : '生体認証を設定'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.authButton, styles.appleButton, loading && styles.disabledButton]}
          onPress={handleAppleAuth}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.charcoal} size="small" />
          ) : (
            <>
              <FontAwesome5 name="apple" size={20} color={colors.charcoal} brand style={styles.buttonIcon} />
              <Text style={styles.appleButtonText}>Apple IDでサインイン</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authButton, styles.googleButton, loading && styles.disabledButton]}
          onPress={handleGoogleAuth}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.charcoal} size="small" />
          ) : (
            <>
              <FontAwesome5 name="google" size={20} color={colors.charcoal} brand style={styles.buttonIcon} />
              <Text style={styles.googleButtonText}>Googleでサインイン</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authButton, styles.smsButton, loading && styles.disabledButton]}
          onPress={handleSMSAuth}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.charcoal} size="small" />
          ) : (
            <>
              <FontAwesome5 name="phone" size={20} color={colors.charcoal} solid style={styles.buttonIcon} />
              <Text style={styles.smsButtonText}>電話番号でサインイン</Text>
            </>
          )}
        </TouchableOpacity>

        {__DEV__ && (
          <>
            <TouchableOpacity
              style={[styles.authButton, styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetSMSLimit}
              activeOpacity={0.8}
              disabled={loading}
            >
              <>
                <FontAwesome5 name="redo" size={18} color={colors.charcoal} solid style={styles.buttonIcon} />
                <Text style={styles.resetButtonText}>SMS制限リセット（開発環境）</Text>
              </>
            </TouchableOpacity>
            
            {biometricAvailable && (
              <TouchableOpacity
                style={[styles.authButton, styles.resetButton, loading && styles.disabledButton]}
                onPress={handleDisableBiometric}
                activeOpacity={0.8}
                disabled={loading}
              >
                <>
                  <FontAwesome5 name="fingerprint" size={18} color={colors.charcoal} solid style={styles.buttonIcon} />
                  <Text style={styles.resetButtonText}>生体認証無効化（開発環境）</Text>
                </>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* 開発環境専用：認証スキップボタン */}
        {isDevelopment && (
          <TouchableOpacity
            style={[styles.authButton, styles.devSkipButton, loading && styles.disabledButton]}
            onPress={handleDevSkipAuth}
            activeOpacity={0.8}
            disabled={loading}
          >
            <>
              <FontAwesome5 name="code" size={18} color={colors.charcoal} solid style={styles.buttonIcon} />
              <Text style={styles.devSkipButtonText}>認証なしログイン（開発環境）</Text>
            </>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          続行することで、利用規約とプライバシーポリシーに同意したものとみなされます
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: 40,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  authSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.beige,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.beige,
  },
  smsButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.beige,
  },
  biometricButton: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  appleButtonText: {
    color: colors.charcoal,
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: colors.charcoal,
    fontSize: 16,
    fontWeight: '600',
  },
  smsButtonText: {
    color: colors.charcoal,
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.beige,
  },
  resetButtonText: {
    color: colors.charcoal,
    fontSize: 14,
    fontWeight: '600',
  },
  devSkipButton: {
    backgroundColor: colors.cream,
    borderColor: colors.darkGray,
    borderWidth: 1,
  },
  devSkipButtonText: {
    color: colors.charcoal,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 32,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});