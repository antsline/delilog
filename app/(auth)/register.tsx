import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, usePathname } from 'expo-router';
import { colors } from '@/constants/colors';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const pathname = usePathname();
  console.log('*** RegisterScreen (Clean) レンダリング開始 - パス:', pathname);
  
  const [formData, setFormData] = useState({
    companyName: '',
    driverName: '',
    plateArea: '',
    plateClass: '',
    plateHiragana: '',
    plateNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { user, hasProfile, profile, refreshProfile } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  // 全ての Hook を先に定義
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = React.useMemo(() => {
    return !!(
      formData.companyName.trim() && 
      formData.driverName.trim() && 
      formData.plateArea.trim() && 
      formData.plateClass.trim() && 
      formData.plateHiragana.trim() && 
      formData.plateNumber.trim()
    );
  }, [formData]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);
      
      if (__DEV__ && !user) {
        Alert.alert(
          '開発環境テスト',
          '登録情報を保存しました（テスト環境）。',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
        return;
      }
      
      const fullPlateNumber = `${formData.plateArea}${formData.plateClass}${formData.plateHiragana}${formData.plateNumber}`.trim();
      
      const profile = await AuthService.createUserProfile({
        companyName: formData.companyName.trim(),
        driverName: formData.driverName.trim(),
        plateNumber: fullPlateNumber,
      });

      console.log('プロフィール作成成功:', profile);
      await refreshProfile();

      Alert.alert(
        '登録完了',
        'プロフィールの登録が完了しました。',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('メイン画面に遷移中...');
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('プロフィール作成エラー:', error);
      Alert.alert(
        '登録エラー',
        'プロフィールの登録に失敗しました。入力内容を確認してもう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  // シンプルなプロフィールチェック - Hook の順序を保つため常に実行
  React.useEffect(() => {
    console.log('*** Clean useAuth状態:', { user: !!user, hasProfile, profile: !!profile });
    
    if (hasProfile && profile) {
      console.log('*** プロフィール存在 - メイン画面へリダイレクト');
      // プロフィールが存在する場合はタブ画面にリダイレクト
      router.replace('/(tabs)');
    }
  }, [hasProfile, profile, pathname]);

  // プロフィールが存在する場合はタブ画面にリダイレクト（メイン画面UIは表示しない）
  if (hasProfile && profile) {
    return null; // リダイレクト中は何も表示しない
  }


  // 通常の登録フォーム表示
  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>初期設定</Text>
            <Text style={styles.subtitle}>
              アプリを利用するために必要な情報を入力してください
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                屋号 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => handleInputChange('companyName', text)}
                placeholder="例：田中運送"
                placeholderTextColor={colors.beige}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                運転者名 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.driverName}
                onChangeText={(text) => handleInputChange('driverName', text)}
                placeholder="例：田中太郎"
                placeholderTextColor={colors.beige}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                車両番号（ナンバープレート） <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.plateContainer}>
                <View style={styles.plateRow}>
                  <View style={styles.plateFieldContainer}>
                    <Text style={styles.plateLabel}>地域</Text>
                    <TextInput
                      style={[styles.input, styles.plateInput]}
                      value={formData.plateArea}
                      onChangeText={(text) => handleInputChange('plateArea', text)}
                      placeholder="品川"
                      placeholderTextColor={colors.beige}
                      maxLength={3}
                    />
                  </View>
                  
                  <View style={styles.plateFieldContainer}>
                    <Text style={styles.plateLabel}>分類番号</Text>
                    <TextInput
                      style={[styles.input, styles.plateInput]}
                      value={formData.plateClass}
                      onChangeText={(text) => handleInputChange('plateClass', text)}
                      placeholder="500"
                      placeholderTextColor={colors.beige}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                </View>
                
                <View style={styles.plateRow}>
                  <View style={styles.plateFieldContainer}>
                    <Text style={styles.plateLabel}>ひらがな</Text>
                    <TextInput
                      style={[styles.input, styles.plateInput]}
                      value={formData.plateHiragana}
                      onChangeText={(text) => handleInputChange('plateHiragana', text)}
                      placeholder="あ"
                      placeholderTextColor={colors.beige}
                      maxLength={1}
                    />
                  </View>
                  
                  <View style={styles.plateFieldContainer}>
                    <Text style={styles.plateLabel}>一連指定番号</Text>
                    <TextInput
                      style={[styles.input, styles.plateInput]}
                      value={formData.plateNumber}
                      onChangeText={(text) => handleInputChange('plateNumber', text)}
                      placeholder="1234"
                      placeholderTextColor={colors.beige}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
          activeOpacity={0.8}
          delayPressIn={0}
          delayPressOut={0}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          {loading ? (
            <ActivityIndicator color={colors.cream} size="small" />
          ) : (
            <Text style={[
              styles.submitButtonText,
              (!isFormValid || loading) && styles.submitButtonTextDisabled,
            ]}>
              登録完了
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  required: {
    color: colors.error,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.charcoal,
    backgroundColor: colors.cream,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  submitButton: {
    height: 56,
    backgroundColor: colors.orange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.beige,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  submitButtonTextDisabled: {
    color: colors.darkGray,
  },
  plateContainer: {
    gap: 12,
  },
  plateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  plateFieldContainer: {
    flex: 1,
    gap: 4,
  },
  plateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
  },
  plateInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});