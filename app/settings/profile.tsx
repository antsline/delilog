import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/authService';
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/types/profileValidation';

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // React Hook Form設定
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      companyName: profile?.company_name || '',
      driverName: profile?.driver_name || '',
    },
    mode: 'onChange',
  });

  // フォーム送信処理
  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setSubmitting(true);
      
      await AuthService.updateUserProfile({
        companyName: data.companyName.trim(),
        driverName: data.driverName.trim(),
      });
      
      // プロフィール情報を再取得
      await refreshProfile();
      
      // 成功フィードバック
      Alert.alert(
        '更新完了',
        'プロフィール情報を更新しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
      
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      Alert.alert(
        '更新エラー',
        error instanceof Error ? error.message : 'プロフィール情報の更新に失敗しました'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>プロフィール編集</Text>
        </View>

        {/* フォーム */}
        <View style={styles.form}>
          {/* 屋号 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              屋号 <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="companyName"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.companyName && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="例：田中運送"
                  placeholderTextColor={colors.beige}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
            />
            {errors.companyName && (
              <Text style={styles.errorText}>{errors.companyName.message}</Text>
            )}
          </View>

          {/* 運転者名 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              運転者名 <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="driverName"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.driverName && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="例：田中太郎"
                  placeholderTextColor={colors.beige}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
            />
            {errors.driverName && (
              <Text style={styles.errorText}>{errors.driverName.message}</Text>
            )}
          </View>

        </View>
      </ScrollView>

      {/* 送信ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || !isDirty || submitting) && styles.submitButtonDisabled
          ]}
          disabled={!isValid || !isDirty || submitting}
          onPress={handleSubmit(onSubmit)}
        >
          <View style={styles.submitButtonContent}>
            {submitting && (
              <ActivityIndicator 
                size="small" 
                color={(!isValid || !isDirty || submitting) ? colors.darkGray : colors.cream}
                style={styles.submitButtonSpinner}
              />
            )}
            <Text style={[
              styles.submitButtonText,
              (!isValid || !isDirty || submitting) && styles.submitButtonTextDisabled
            ]}>
              {submitting ? '更新中...' : '更新する'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
  },
  backIconText: {
    fontSize: 24,
    color: colors.charcoal,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    padding: 20,
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
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonSpinner: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  submitButtonTextDisabled: {
    color: colors.darkGray,
  },
});