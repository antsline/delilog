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
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useTenko } from '@/hooks/useTenko';
import { tenkoBeforeSchema, type TenkoBeforeFormData } from '@/types/tenkoValidation';
import { VoiceInput } from '@/components/VoiceInput';
import { TenkoService } from '@/services/tenkoService';

export default function TenkoBeforeScreen() {
  const { user, profile } = useAuth();
  const { vehicles, todayStatus } = useTenko();
  const [submitting, setSubmitting] = React.useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = React.useState(false);

  // React Hook Form設定
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<TenkoBeforeFormData>({
    resolver: zodResolver(tenkoBeforeSchema),
    defaultValues: {
      vehicleId: '',
      checkMethod: '対面',
      executor: '本人',
      alcoholLevel: '0.00',
      healthStatus: 'good',
      dailyCheckCompleted: true,
      notes: '',
    },
    mode: 'all',
  });

  const watchedValues = watch();
  
  // デバッグ用: フォームの状態をログ出力
  React.useEffect(() => {
    console.log('*** tenko-before form state:', {
      isValid,
      errors,
      values: watchedValues
    });
  }, [isValid, errors, watchedValues]);

  // 初期化処理（車両選択 + その他のフィールド）
  React.useEffect(() => {
    // デフォルト車両の自動選択
    const defaultVehicle = vehicles.find(v => v.is_default && v.is_active);
    if (defaultVehicle && !watchedValues.vehicleId) {
      setValue('vehicleId', defaultVehicle.id, { shouldValidate: true });
    }
    
    // その他のフィールドの初期値設定
    setValue('healthStatus', 'good', { shouldValidate: true });
    setValue('dailyCheckCompleted', true, { shouldValidate: true });
    setValue('checkMethod', '対面', { shouldValidate: true });
    setValue('executor', '本人', { shouldValidate: true });
    setValue('alcoholLevel', '0.00', { shouldValidate: true });
    setValue('notes', '', { shouldValidate: true });
  }, [vehicles, setValue, watchedValues.vehicleId]);

  // フォーム送信処理
  const onSubmit = async (data: TenkoBeforeFormData) => {
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
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
        type: 'before' as const,
        check_method: data.checkMethod,
        executor: data.executor,
        alcohol_level: parseFloat(data.alcoholLevel),
        health_status: data.healthStatus,
        daily_check_completed: data.dailyCheckCompleted,
        notes: data.notes || undefined,
        platform: 'mobile' as const,
      };

      await TenkoService.createTenkoRecord(tenkoData);
      
      // 成功フィードバック
      Alert.alert(
        '記録完了',
        '業務前点呼を記録しました',
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
  if (todayStatus.beforeCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>本日の業務前点呼は完了済みです</Text>
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
              router.back();
            }}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>業務前点呼</Text>
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
            render={({ field: { value, onChange } }) => {
              const selectedVehicle = vehicles.find(v => v.id === value);
              
              return (
                <View style={styles.vehicleDropdownContainer}>
                  {vehicles.length > 0 ? (
                    <>
                      {/* ドロップダウンボタン */}
                      <TouchableOpacity
                        style={[
                          styles.vehicleDropdownButton,
                          value && styles.vehicleDropdownButtonSelected
                        ]}
                        onPress={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                      >
                        <View style={styles.vehicleDropdownButtonContent}>
                          <Text style={[
                            styles.vehicleDropdownButtonText,
                            value && styles.vehicleDropdownButtonTextSelected
                          ]}>
                            {selectedVehicle ? selectedVehicle.plate_number : '車両を選択してください'}
                          </Text>
                          {selectedVehicle?.is_default && (
                            <Text style={styles.defaultBadgeDropdown}>デフォルト</Text>
                          )}
                        </View>
                        <Feather 
                          name={vehicleDropdownOpen ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={colors.charcoal} 
                        />
                      </TouchableOpacity>
                      
                      {/* ドロップダウンメニュー */}
                      {vehicleDropdownOpen && (
                        <View style={styles.vehicleDropdownMenu}>
                          {vehicles.map((vehicle) => (
                            <TouchableOpacity
                              key={vehicle.id}
                              style={[
                                styles.vehicleDropdownOption,
                                value === vehicle.id && styles.vehicleDropdownOptionSelected
                              ]}
                              onPress={() => {
                                onChange(vehicle.id);
                                setVehicleDropdownOpen(false);
                              }}
                            >
                              <Text style={[
                                styles.vehicleDropdownOptionText,
                                value === vehicle.id && styles.vehicleDropdownOptionTextSelected
                              ]}>
                                {vehicle.plate_number}
                              </Text>
                              {vehicle.is_default && (
                                <Text style={styles.defaultBadgeDropdown}>デフォルト</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noVehicleContainer}>
                      <Text style={styles.noVehicleText}>
                        車両が登録されていません。設定画面から車両を追加してください。
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
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
                    // キーボードを閉じる
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

        {/* 健康状態 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>健康状態</Text>
          <Controller
            control={control}
            name="healthStatus"
            render={({ field: { value, onChange } }) => (
              <View style={styles.healthStatusContainer}>
                {[
                  { key: 'good', label: '良好' },
                  { key: 'caution', label: '注意' },
                  { key: 'poor', label: '不良' }
                ].map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[
                      styles.healthOption,
                      value === status.key && { backgroundColor: colors.charcoal }
                    ]}
                    onPress={() => onChange(status.key as 'good' | 'caution' | 'poor')}
                  >
                    <Text style={[
                      styles.healthOptionText,
                      value === status.key && styles.healthOptionTextSelected
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.healthStatus && (
            <Text style={styles.errorText}>{errors.healthStatus.message}</Text>
          )}
        </View>

        {/* 日常点検 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日常点検実施</Text>
          <Controller
            control={control}
            name="dailyCheckCompleted"
            render={({ field: { value, onChange } }) => (
              <View style={styles.dailyCheckContainer}>
                <TouchableOpacity
                  style={[
                    styles.dailyCheckOption,
                    value === true && { backgroundColor: colors.charcoal }
                  ]}
                  onPress={() => onChange(true)}
                >
                  <Text style={[
                    styles.dailyCheckOptionText,
                    value === true && styles.dailyCheckOptionTextSelected
                  ]}>
                    実施
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dailyCheckOption,
                    value === false && { backgroundColor: colors.charcoal }
                  ]}
                  onPress={() => onChange(false)}
                >
                  <Text style={[
                    styles.dailyCheckOptionText,
                    value === false && styles.dailyCheckOptionTextSelected
                  ]}>
                    未実施
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
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
                    // キーボードを閉じる
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
              {submitting ? '記録中...' : '業務前点呼を記録'}
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
  vehicleDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  vehicleDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  vehicleDropdownButtonSelected: {
    borderColor: colors.beige,
  },
  vehicleDropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleDropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.beige,
    flex: 1,
  },
  vehicleDropdownButtonTextSelected: {
    color: colors.charcoal,
  },
  vehicleDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
  },
  vehicleDropdownOptionSelected: {
    backgroundColor: colors.charcoal,
  },
  vehicleDropdownOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    flex: 1,
  },
  vehicleDropdownOptionTextSelected: {
    color: '#FFFFFF',
  },
  defaultBadgeDropdown: {
    backgroundColor: colors.orange,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
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
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.beige,
  },
  radioCircleSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.charcoal,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.beige,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: colors.success,
  },
  switchOnWarning: {
    backgroundColor: colors.error,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignSelf: 'flex-start',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alcoholInput: {
    backgroundColor: '#FFFFFF',
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
  healthStatusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  healthOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  healthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  healthOptionTextSelected: {
    color: colors.cream,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  checkboxContainerChecked: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.beige,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkmark: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
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
  dailyCheckContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dailyCheckOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dailyCheckOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  dailyCheckOptionTextSelected: {
    color: colors.cream,
  },
  // register.tsx から動作するスタイルをコピー
  taskCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
});