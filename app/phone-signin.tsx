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

export default function PhoneSignInScreen() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

    setIsLoading(true);
    Logger.info('認証コード送信開始', phoneNumber);

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
    >
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
    </ScrollView>
  );

  const renderCodeStep = () => (
    <ScrollView 
      style={styles.content} 
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
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

        {/* コンテンツ */}
        {step === 'phone' ? renderPhoneStep() : renderCodeStep()}

        {/* フッター */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>
              メールアドレスでサインイン
            </Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 32,
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
    marginBottom: 16,
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  footerLink: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
  },
});