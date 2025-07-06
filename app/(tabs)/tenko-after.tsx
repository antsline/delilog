import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useTenko } from '@/hooks/useTenko';
import { tenkoAfterSchema, type TenkoAfterFormData } from '@/types/tenkoValidation';
import { VoiceInput } from '@/components/VoiceInput';
import { TenkoService } from '@/services/tenkoService';

export default function TenkoAfterScreen() {
  const { user, profile } = useAuth();
  const { vehicles, todayStatus } = useTenko();
  const [submitting, setSubmitting] = React.useState(false);

  // React Hook Form設定
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<TenkoAfterFormData>({
    resolver: zodResolver(tenkoAfterSchema),
    defaultValues: {
      vehicleId: '',
      checkMethod: '対面',
      executor: '本人',
      alcoholLevel: '0.00',
      operationStatus: 'ok',
      notes: '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // デフォルト車両の自動選択
  React.useEffect(() => {
    const defaultVehicle = vehicles.find(v => v.is_default && v.is_active);
    if (defaultVehicle && !watchedValues.vehicleId) {
      setValue('vehicleId', defaultVehicle.id);
    }
  }, [vehicles, setValue, watchedValues.vehicleId]);

  // フォーム送信処理
  const onSubmit = async (data: TenkoAfterFormData) => {
    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    try {
      setSubmitting(true);
      
      // データ保存処理
      const tenkoData = {
        user_id: user.id,
        vehicle_id: data.vehicleId,
        date: new Date().toISOString().split('T')[0],
        type: 'after' as const,
        check_method: data.checkMethod,
        executor: data.executor,
        alcohol_level: parseFloat(data.alcoholLevel),
        operation_status: data.operationStatus,
        notes: data.notes || null,
        platform: 'mobile' as const,
      };

      await TenkoService.createTenkoRecord(tenkoData);
      
      // 成功フィードバック
      Alert.alert(
        '記録完了',
        '業務後点呼を記録しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
      
    } catch (error) {
      console.error('点呼記録保存エラー:', error);
      Alert.alert(
        'エラー',
        error instanceof Error ? error.message : '記録の保存に失敗しました'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 音声入力処理
  const handleVoiceInput = (text: string) => {
    const currentNotes = watchedValues.notes || '';
    const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
    setValue('notes', newNotes);
  };

  // 今日の日時
  const now = new Date();
  const dateString = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const timeString = now.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 既に記録済みかチェック
  if (todayStatus.afterCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>本日の業務後点呼は完了済みです</Text>
          <Text style={styles.completedMessage}>
            記録を確認・編集したい場合は記録一覧画面からアクセスしてください。
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <View style={styles.keyboardAvoidingView}>
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
            onPress={() => {
              console.log('*** 戻るボタン押下');
              router.replace('/(auth)/register');
            }}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>業務後点呼</Text>
        </View>

        {/* 実施日時 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>実施日時</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeText}>{dateString} {timeString}</Text>
          </View>
        </View>

        {/* 車両選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            車両番号 <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="vehicleId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.vehicleSelection}>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleOption,
                        value === vehicle.id && styles.vehicleOptionSelected
                      ]}
                      onPress={() => onChange(vehicle.id)}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        value === vehicle.id && styles.vehicleOptionTextSelected
                      ]}>
                        {vehicle.plate_number}
                      </Text>
                      {vehicle.is_default && (
                        <Text style={styles.defaultBadge}>デフォルト</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noVehicleContainer}>
                    <Text style={styles.noVehicleText}>
                      車両が登録されていません。設定画面から車両を追加してください。
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
          {errors.vehicleId && (
            <Text style={styles.errorText}>{errors.vehicleId.message}</Text>
          )}
        </View>

        {/* 点呼方法・執行者 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>点呼方法・執行者</Text>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>点呼方法</Text>
              <Controller
                control={control}
                name="checkMethod"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="点呼方法"
                    placeholderTextColor={colors.beige}
                  />
                )}
              />
              {errors.checkMethod && (
                <Text style={styles.errorText}>{errors.checkMethod.message}</Text>
              )}
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>執行者</Text>
              <Controller
                control={control}
                name="executor"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="執行者名"
                    placeholderTextColor={colors.beige}
                  />
                )}
              />
              {errors.executor && (
                <Text style={styles.errorText}>{errors.executor.message}</Text>
              )}
            </View>
          </View>
        </View>

        {/* アルコール検知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アルコール検知</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>アルコール数値</Text>
            <Controller
              control={control}
              name="alcoholLevel"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.alcoholInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.beige}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />
              )}
            />
            <Text style={styles.unit}>mg/L</Text>
          </View>
          {errors.alcoholLevel && (
            <Text style={styles.errorText}>{errors.alcoholLevel.message}</Text>
          )}
        </View>

        {/* 運行状況 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>運行状況</Text>
          <Controller
            control={control}
            name="operationStatus"
            render={({ field: { value, onChange } }) => (
              <View style={styles.operationStatusContainer}>
                <TouchableOpacity
                  style={[
                    styles.operationStatusOption,
                    value === 'ok' && { backgroundColor: colors.charcoal }
                  ]}
                  onPress={() => onChange('ok')}
                >
                  <Text style={[
                    styles.operationStatusOptionText,
                    value === 'ok' && styles.operationStatusOptionTextSelected
                  ]}>
                    正常
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.operationStatusOption,
                    value === 'ng' && { backgroundColor: colors.charcoal }
                  ]}
                  onPress={() => onChange('ng')}
                >
                  <Text style={[
                    styles.operationStatusOptionText,
                    value === 'ng' && styles.operationStatusOptionTextSelected
                  ]}>
                    異常
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.operationStatus && (
            <Text style={styles.errorText}>{errors.operationStatus.message}</Text>
          )}
        </View>

        {/* 特記事項 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>特記事項</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange } }) => (
              <>
                <TextInput
                  style={styles.notesInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="特記事項があれば入力してください"
                  placeholderTextColor={colors.beige}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />
                <VoiceInput onTranscription={handleVoiceInput} />
              </>
            )}
          />
          {errors.notes && (
            <Text style={styles.errorText}>{errors.notes.message}</Text>
          )}
        </View>
        </ScrollView>

        {/* 送信ボタン */}
        <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || submitting) && styles.submitButtonDisabled
          ]}
          disabled={!isValid || submitting}
          onPress={handleSubmit(onSubmit)}
        >
          <View style={styles.submitButtonContent}>
            {submitting && (
              <ActivityIndicator 
                size="small" 
                color={(!isValid || submitting) ? colors.darkGray : colors.cream}
                style={styles.submitButtonSpinner}
              />
            )}
            <Text style={[
              styles.submitButtonText,
              (!isValid || submitting) && styles.submitButtonTextDisabled
            ]}>
              {submitting ? '記録中...' : '業務後点呼を記録'}
            </Text>
          </View>
        </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 24,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 16,
  },
  required: {
    color: colors.error,
  },
  dateTimeContainer: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: 4,
  },
  vehicleSelection: {
    gap: 12,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  vehicleOptionSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orange + '10',
  },
  vehicleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  vehicleOptionTextSelected: {
    color: colors.orange,
  },
  defaultBadge: {
    backgroundColor: colors.charcoal,
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.charcoal,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alcoholInput: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.charcoal,
    width: 80,
    textAlign: 'center',
  },
  unit: {
    fontSize: 14,
    color: colors.darkGray,
  },
  operationStatusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  operationStatusOption: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  operationStatusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  operationStatusOptionTextSelected: {
    color: colors.cream,
  },
  notesInput: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.charcoal,
    minHeight: 100,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: colors.cream,
  },
  submitButtonTextDisabled: {
    color: colors.darkGray,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  noVehicleContainer: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noVehicleText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 16,
  },
  completedMessage: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
});