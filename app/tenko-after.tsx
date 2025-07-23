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
import { tenkoAfterSchema, type TenkoAfterFormData } from '@/types/tenkoValidation';
import VoiceInputButton from '@/components/ui/VoiceInputButton';
import HelpButton from '@/components/common/HelpButton';
import { TenkoService } from '@/services/tenkoService';
import { useOfflineStore, useNetworkStatus, useIsOffline } from '@/store/offlineStore';
import { getTodayJapanDateString } from '@/utils/dateUtils';

export default function TenkoAfterScreen() {
  const { user, profile } = useAuth();
  const { vehicles, todayStatus, refreshData } = useTenko();
  const [submitting, setSubmitting] = React.useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = React.useState(false);
  
  // オフライン機能
  const offlineStore = useOfflineStore();
  const networkStatus = useNetworkStatus();
  const isOffline = useIsOffline();

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
      alcoholDetectorUsed: true,
      healthStatus: 'good',
      operationStatus: 'ok',
      notes: '',
    },
    mode: 'all',
  });

  const watchedValues = watch();
  
  // デバッグ用: フォームの状態をログ出力
  React.useEffect(() => {
    console.log('*** tenko-after form state:', {
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
    setValue('operationStatus', 'ok', { shouldValidate: true });
    setValue('checkMethod', '対面', { shouldValidate: true });
    setValue('executor', '本人', { shouldValidate: true });
    setValue('alcoholLevel', '0.00', { shouldValidate: true });
    setValue('alcoholDetectorUsed', true, { shouldValidate: true });
    setValue('notes', '', { shouldValidate: true });
  }, [vehicles, setValue, watchedValues.vehicleId]);

  // フォーム送信処理
  const onSubmit = async (data: TenkoAfterFormData) => {
    console.log('*** tenko-after onSubmit START:', {
      formData: data,
      user: user?.id,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('*** tenko-after: Before saving record');
      
      // データ保存処理
      const tenkoData = {
        user_id: user.id,
        vehicle_id: data.vehicleId,
        date: getTodayJapanDateString(), // 日本時間での今日の日付
        type: 'after' as const,
        check_method: data.checkMethod,
        executor: data.executor,
        alcohol_detector_used: true, // アルコール検知器使用
        alcohol_detected: parseFloat(data.alcoholLevel) > 0, // アルコール検知有無
        alcohol_level: parseFloat(data.alcoholLevel),
        health_status: data.healthStatus,
        operation_status: data.operationStatus,
        notes: data.notes || undefined,
        platform: 'mobile' as const,
        is_offline_created: false, // サーバー保存の場合はfalse
      };

      console.log('*** tenko-after: Record data prepared:', {
        tenkoData,
        isOffline,
        timestamp: new Date().toISOString()
      });

      // オフライン時はローカル保存、オンライン時はサーバー保存
      if (isOffline) {
        // オフライン時のローカル保存
        const localRecord = {
          ...tenkoData,
          local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          is_synced: false,
          is_offline_created: true,
          created_at_local: new Date().toISOString(),
          updated_at_local: new Date().toISOString(),
        };
        
        await offlineStore.saveLocalTenkoRecord(localRecord);
        
        console.log('*** tenko-after: Offline record saved successfully:', {
          localRecord,
          timestamp: new Date().toISOString()
        });
        
        // Force refresh data to update session status
        console.log('*** tenko-after: Refreshing data after offline save');
        await refreshData();
        
        Alert.alert(
          '記録完了（オフライン）',
          'オフライン記録として保存しました。\nネットワーク復旧時に自動同期されます。',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            }
          ]
        );
      } else {
        // オンライン時のサーバー保存
        const savedRecord = await TenkoService.createTenkoRecord(tenkoData);
        
        console.log('*** tenko-after: Online record saved successfully:', {
          savedRecord,
          originalData: tenkoData,
          timestamp: new Date().toISOString()
        });
        
        // Force refresh data to update session status immediately
        console.log('*** tenko-after: Refreshing data after online save');
        await refreshData();
        
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
      }
      
    } catch (error) {
      console.error('点呼記録保存エラー:', error);
      
      // オフライン時エラーの場合、ローカル保存を試行
      if (isOffline || (error instanceof Error && error.message.includes('network'))) {
        try {
          const localRecord = {
            user_id: user.id,
            vehicle_id: data.vehicleId,
            date: getTodayJapanDateString(), // 日本時間での今日の日付
            type: 'after' as const,
            check_method: data.checkMethod,
            executor: data.executor,
            alcohol_detector_used: true,
            alcohol_detected: parseFloat(data.alcoholLevel) > 0,
            alcohol_level: parseFloat(data.alcoholLevel),
            health_status: data.healthStatus,
            operation_status: data.operationStatus,
            notes: data.notes || undefined,
            platform: 'mobile' as const,
            local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_synced: false,
            is_offline_created: true,
            created_at_local: new Date().toISOString(),
            updated_at_local: new Date().toISOString(),
          };
          
          await offlineStore.saveLocalTenkoRecord(localRecord);
          
          console.log('*** tenko-after: Fallback offline record saved:', {
            localRecord,
            timestamp: new Date().toISOString()
          });
          
          // Force refresh data to update session status
          console.log('*** tenko-after: Refreshing data after fallback save');
          await refreshData();
          
          Alert.alert(
            '記録完了（オフライン）',
            'ネットワークエラーのため、オフライン記録として保存しました。',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              }
            ]
          );
        } catch (localError) {
          Alert.alert(
            'エラー',
            '記録の保存に失敗しました。しばらく時間をおいて再試行してください。'
          );
        }
      } else {
        Alert.alert(
          'エラー',
          error instanceof Error ? error.message : '記録の保存に失敗しました'
        );
      }
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

  // 既に記録済みかチェック（より厳密な判定）
  const isAfterCompleted = todayStatus.afterCompleted || 
    (todayStatus.afterRecord && todayStatus.afterRecord.id);
  
  console.log('*** tenko-after: 完了状態チェック:', {
    afterCompleted: todayStatus.afterCompleted,
    hasAfterRecord: !!todayStatus.afterRecord,
    afterRecordId: todayStatus.afterRecord?.id,
    isAfterCompleted,
    timestamp: new Date().toISOString()
  });
  
  if (isAfterCompleted) {
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
              router.back();
            }}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>業務後点呼</Text>
          </View>
          <HelpButton
            type="specific"
            helpContent={{
              title: '業務後点呼の記録方法',
              description: '業務終了後に実施する点呼記録の入力画面です。運行状況、健康状態、車両の状態などを記録します。',
              steps: [
                '運転者名と車両を選択',
                '運行状況を「正常」「異常あり」から選択',
                '健康状態を「良好」「不調」から選択',
                'アルコール検知器の数値を入力',
                '車両の異常の有無を確認',
                '必要に応じて特記事項を入力',
                '「業務後点呼を記録」ボタンで保存'
              ]
            }}
            variant="icon"
            size="medium"
          />
        </View>

        {/* オフライン状態表示 */}
        {isOffline && (
          <View style={styles.offlineIndicator}>
            <View style={styles.offlineIndicatorContent}>
              <Feather name="wifi-off" size={16} color={colors.error} />
              <Text style={styles.offlineIndicatorText}>
                オフラインモード - ローカル保存されます
              </Text>
            </View>
          </View>
        )}


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
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>検知器使用</Text>
              <Controller
                control={control}
                name="alcoholDetectorUsed"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.alcoholDetectorContainer}>
                    <TouchableOpacity
                      style={[
                        styles.alcoholDetectorOption,
                        value === true && { backgroundColor: colors.charcoal }
                      ]}
                      onPress={() => onChange(true)}
                    >
                      <Text style={[
                        styles.alcoholDetectorOptionText,
                        value === true && styles.alcoholDetectorOptionTextSelected
                      ]}>
                        使用
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.alcoholDetectorOption,
                        value === false && { backgroundColor: colors.charcoal }
                      ]}
                      onPress={() => onChange(false)}
                    >
                      <Text style={[
                        styles.alcoholDetectorOptionText,
                        value === false && styles.alcoholDetectorOptionTextSelected
                      ]}>
                        未使用
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>アルコール数値</Text>
              <View style={styles.alcoholInputContainer}>
                <Controller
                  control={control}
                  name="alcoholLevel"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      style={[
                        styles.alcoholInput,
                        !watchedValues.alcoholDetectorUsed && styles.alcoholInputDisabled
                      ]}
                      value={watchedValues.alcoholDetectorUsed ? value : ''}
                      onChangeText={watchedValues.alcoholDetectorUsed ? onChange : undefined}
                      placeholder={watchedValues.alcoholDetectorUsed ? "0.00" : ""}
                      placeholderTextColor={colors.beige}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                      }}
                      editable={watchedValues.alcoholDetectorUsed}
                    />
                  )}
                />
                <Text style={[
                  styles.unit,
                  !watchedValues.alcoholDetectorUsed && styles.unitDisabled
                ]}>
                  mg/L
                </Text>
              </View>
            </View>
          </View>
          {(errors.alcoholLevel || errors.alcoholDetectorUsed) && (
            <Text style={styles.errorText}>
              {errors.alcoholLevel?.message || errors.alcoholDetectorUsed?.message}
            </Text>
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
                <View style={styles.voiceInputContainer}>
                  <VoiceInputButton
                    onVoiceResult={(text) => {
                      // 音声入力されたテキストを追加
                      const currentValue = value || '';
                      onChange(currentValue ? `${currentValue}\n${text}` : text);
                    }}
                    placeholder="音声で特記事項を入力"
                  />
                </View>
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
              {submitting ? 
                (isOffline ? 'ローカル保存中...' : '記録中...') : 
                (isOffline ? '業務後点呼を記録（オフライン）' : '業務後点呼を記録')
              }
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
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
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
  textInput: {
    backgroundColor: '#FFFFFF',
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
  alcoholDetectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  alcoholDetectorOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  alcoholDetectorOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  alcoholDetectorOptionTextSelected: {
    color: colors.cream,
  },
  alcoholInputContainer: {
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
    width: 100,
    textAlign: 'center',
  },
  alcoholInputDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray,
    color: colors.darkGray,
  },
  unit: {
    fontSize: 14,
    color: colors.darkGray,
  },
  unitDisabled: {
    color: colors.lightGray,
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
  operationStatusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  operationStatusOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.charcoal,
    minHeight: 100,
  },
  voiceInputContainer: {
    marginTop: 12,
    alignItems: 'center',
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
  // オフライン状態表示
  offlineIndicator: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  offlineIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineIndicatorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
});