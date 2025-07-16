/**
 * 電話番号サインイン画面
 * SMS認証による電話番号ログイン
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { phoneAuthService } from '@/services/phoneAuthService';
import { colors } from '@/constants/colors';
import { Logger } from '@/utils/logger';
import { supabase } from '@/services/supabase';
import { authSessionService } from '@/services/authSessionService';
import { biometricAuthService } from '@/services/biometricAuthService';

export default function PhoneSignInScreen() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [smsRemainingCount, setSmsRemainingCount] = useState<number | null>(null);

  // 初期化時に生体認証とSMS制限の確認
  React.useEffect(() => {
    checkBiometricAvailability();
    checkSMSLimit();
  }, []);

  const checkBiometricAvailability = async () => {
    const sessionInfo = await authSessionService.getSessionInfo();
    if (sessionInfo.biometricEnabled) {
      const biometricResult = await biometricAuthService.isBiometricAvailable();
      setBiometricAvailable(biometricResult.success);
    }
  };

  const checkSMSLimit = async () => {
    const smsCheck = await authSessionService.canUseSMSAuth();
    setSmsRemainingCount(smsCheck.remainingCount);
  };

  // 生体認証でログイン
  const handleBiometricLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // 生体認証を実行
      const biometricResult = await biometricAuthService.authenticate(
        'アプリにログインするために認証が必要です'
      );
      
      if (biometricResult.success) {
        // 既存のセッションがあるかチェック
        const session = await supabase.auth.getSession();
        if (session.data.session) {
          // セッションを延長
          await authSessionService.extendSessionWithBiometric();
          router.replace('/');
        } else {
          Alert.alert('情報', 'セッションが切れています。SMS認証を行ってください。');
        }
      } else {
        Alert.alert('認証エラー', biometricResult.message);
      }
    } catch (error) {
      Logger.error('生体認証ログインエラー', error);
      Alert.alert('エラー', '生体認証でのログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 電話番号フォーマット
  const formatPhoneInput = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 認証コード送信
  const handleSendCode = async () => {
    if (isLoading) return;

    // 電話番号バリデーション
    const validation = phoneAuthService.validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      Alert.alert('入力エラー', validation.message);
      return;
    }

    // SMS認証の回数制限チェック
    const smsCheck = await authSessionService.canUseSMSAuth();
    if (!smsCheck.allowed) {
      Alert.alert(
        'SMS認証制限',
        smsCheck.message,
        [
          { text: 'OK' },
          { text: 'ログイン画面に戻る', onPress: () => router.back() }
        ]
      );
      return;
    }

    setIsLoading(true);
    Logger.info('認証コード送信開始', `${phoneNumber} (残り${smsCheck.remainingCount}回)`);

    try {
      const result = await phoneAuthService.sendVerificationCode(phoneNumber);
      
      if (result.success) {
        setStep('code');
        startCountdown();
        Alert.alert('認証コード送信', result.message);
      } else {
        Alert.alert('エラー', result.message);
      }
    } catch (error) {
      Logger.error('認証コード送信エラー', error);
      Alert.alert('エラー', '認証コードの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 認証コード検証
  const handleVerifyCode = async () => {
    if (isLoading) return;

    if (verificationCode.length !== 6) {
      Alert.alert('入力エラー', '6桁の認証コードを入力してください');
      return;
    }

    setIsLoading(true);
    Logger.info('認証コード検証開始', { phone: phoneNumber, code: verificationCode });

    try {
      const result = await phoneAuthService.verifyCode(phoneNumber, verificationCode);
      
      if (result.success) {
        Logger.success('電話番号認証成功', result.user?.id);
        
        // 生体認証が利用可能な場合は有効化を提案
        const biometricCheck = await biometricAuthService.isBiometricAvailable();
        if (biometricCheck.success) {
          Alert.alert(
            '生体認証の設定',
            '次回からSMS認証なしでログインできます。生体認証を有効にしますか？',
            [
              { text: 'あとで', style: 'cancel' },
              { 
                text: '有効にする', 
                onPress: async () => {
                  console.log('*** 生体認証有効化ボタンが押されました');
                  try {
                    const enableResult = await authSessionService.enableBiometricAuth();
                    console.log('*** 生体認証有効化結果:', enableResult);
                    Alert.alert(
                      enableResult.success ? '設定完了' : 'エラー', 
                      enableResult.message,
                      [{ text: 'OK' }]
                    );
                  } catch (error) {
                    console.error('*** 生体認証有効化でエラー:', error);
                    Alert.alert(
                      'エラー', 
                      `生体認証の設定に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      [{ text: 'OK' }]
                    );
                  }
                }
              }
            ]
          );
        }
        
        // 認証成功後、プロフィール作成が必要かどうかチェック
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', result.user.id)
          .single();

        if (profile) {
          // プロフィールが存在する場合、メイン画面に遷移
          router.replace('/');
        } else {
          // プロフィールが存在しない場合、登録画面に遷移
          router.replace('/(auth)/register');
        }
      } else {
        Alert.alert('認証エラー', result.message);
      }
    } catch (error) {
      Logger.error('認証コード検証エラー', error);
      Alert.alert('エラー', '認証コードの検証に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 再送信カウントダウン
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 戻る
  const handleBack = () => {
    if (step === 'code') {
      setStep('phone');
      setVerificationCode('');
    } else {
      router.back();
    }
  };

  const renderPhoneStep = () => (
    <ScrollView 
      style={styles.content} 
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      scrollEventThrottle={16}
    >
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait" size={80} color={colors.orange} />
        </View>

        <Text style={styles.title}>電話番号でサインイン</Text>
        <Text style={styles.subtitle}>
          携帯電話番号を入力してください。{'\n'}
          SMS認証コードを送信します。
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>携帯電話番号</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneInput(text))}
            placeholder="090-1234-5678"
            keyboardType="numeric"
            maxLength={13}
            autoFocus
          />
          <Text style={styles.inputHelper}>
            日本の携帯電話番号を入力してください
          </Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <Text style={styles.buttonText}>認証コードを送信</Text>
          )}
        </TouchableOpacity>

        {/* 生体認証ボタン */}
        {biometricAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, isLoading && styles.buttonDisabled]}
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            <Ionicons name="finger-print" size={24} color={colors.orange} />
            <Text style={styles.biometricText}>生体認証でログイン</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderCodeStep = () => (
    <ScrollView 
      style={styles.content} 
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      scrollEventThrottle={16}
    >
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={80} color={colors.orange} />
        </View>

        <Text style={styles.title}>認証コードを入力</Text>
        <Text style={styles.subtitle}>
          {phoneNumber}に送信された{'\n'}
          6桁の認証コードを入力してください
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>認証コード</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="123456"
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <Text style={styles.buttonText}>認証する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
          onPress={handleSendCode}
          disabled={countdown > 0 || isLoading}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
            {countdown > 0 ? `再送信まで ${countdown}秒` : '認証コードを再送信'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'phone' ? '電話番号入力' : '認証コード入力'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* コンテンツ */}
        {step === 'phone' ? renderPhoneStep() : renderCodeStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  topSection: {
    flexShrink: 1,
  },
  buttonSection: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: colors.cream,
    color: colors.charcoal,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
  },
  inputHelper: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.orange,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: colors.beige,
  },
  buttonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: colors.darkGray,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  biometricText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});