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

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { user, hasProfile, loading: authLoading } = useAuth();

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
    // SMS認証は電話番号入力が必要なので、別画面に遷移
    Alert.alert(
      'SMS認証',
      'SMS認証機能は次のアップデートで実装予定です。',
      [{ text: 'OK' }]
    );
  };

  const handleTestAuth = async () => {
    try {
      setLoading(true);
      
      // 既存のテストユーザー（田中太郎）としてログイン
      await AuthService.signInWithTest();
      
      console.log('*** テストログイン成功 - index.tsxで再評価');
      
      // 認証状態の再評価のためにindex.tsxにリダイレクト
      router.replace('/');
      
    } catch (error) {
      console.error('テスト認証エラー:', error);
      Alert.alert(
        '認証エラー',
        `テスト認証に失敗しました。\nエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
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
              style={[styles.authButton, styles.testButton, loading && styles.disabledButton]}
              onPress={handleTestAuth}
              activeOpacity={0.8}
              disabled={loading}
            >
              <>
                <FontAwesome5 name="flask" size={18} color={colors.charcoal} solid style={styles.buttonIcon} />
                <Text style={styles.testButtonText}>テスト用ログイン（開発環境）</Text>
              </>
            </TouchableOpacity>
          </>
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
  disabledButton: {
    opacity: 0.6,
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.beige,
  },
  testButtonText: {
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