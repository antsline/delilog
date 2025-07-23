import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  AppState
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { PDFService } from '@/services/pdfService';
import { VehicleService } from '@/services/vehicleService';
import { TenkoService } from '@/services/tenkoService';
import { NoOperationService } from '@/services/noOperationService';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { formatDateToYYYYMMDD, parseJapanDateString } from '@/utils/dateUtils';

export default function PDFExportScreen() {
  const { user, profile } = useAuthStore();
  const params = useLocalSearchParams();
  
  // URL パラメータから初期値を設定
  const [selectedDate, setSelectedDate] = React.useState(() => {
    if (params.year && params.month && params.day) {
      const year = parseInt(params.year as string);
      const month = parseInt(params.month as string);
      const day = parseInt(params.day as string);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  
  const [selectedType, setSelectedType] = React.useState<'tenko' | 'daily-check' | 'operation-record'>(
    (params.type as 'tenko' | 'daily-check' | 'operation-record') || 'tenko'
  );
  const [pdfState, setPdfState] = React.useState({
    isGenerating: false,
    isSharing: false,
    error: null as string | null
  });
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  // パラメータが変更された時に日付を更新
  React.useEffect(() => {
    if (params.year && params.month && params.day) {
      const year = parseInt(params.year as string);
      const month = parseInt(params.month as string);
      const day = parseInt(params.day as string);
      setSelectedDate(new Date(year, month - 1, day));
    }
  }, [params.year, params.month, params.day]);

  // 画面にフォーカスが戻った時にPDF状態をリセット
  useFocusEffect(
    React.useCallback(() => {
      // 画面にフォーカスが戻った時は全ての状態をリセット
      console.log('PDF export screen focused, resetting state');
      setPdfState({
        isGenerating: false,
        isSharing: false,
        error: null
      });
    }, [])
  );

  // タイムアウト機能を追加して状態をリセット
  React.useEffect(() => {
    let timeoutId: number;
    
    if (pdfState.isSharing) {
      // 共有が2秒以上続く場合は強制的にリセット（AppStateで検出できない場合のフォールバック）
      timeoutId = setTimeout(() => {
        console.log('PDF sharing timeout, resetting state');
        setPdfState(prev => ({ ...prev, isSharing: false }));
      }, 2000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pdfState.isSharing]);

  // 選択された日が含まれる週の範囲を取得（日本時間ベース）
  const getWeekRange = (date: Date) => {
    // 日本時間での日付文字列を取得
    const dateString = formatDateToYYYYMMDD(date);
    const japanDate = parseJapanDateString(dateString);
    const dayOfWeek = japanDate.getDay(); // 0: 日曜日, 6: 土曜日
    
    // 週の開始日（日曜日）を計算
    const startDate = new Date(japanDate);
    startDate.setDate(japanDate.getDate() - dayOfWeek);
    
    // 週の終了日（土曜日）を計算
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return { startDate, endDate };
  };

  // PDF生成処理
  const generatePDF = async () => {
    if (!user || !profile) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    // すでに処理中の場合は実行しない
    if (pdfState.isGenerating || pdfState.isSharing) {
      return;
    }

    try {
      setPdfState(prev => ({ ...prev, isGenerating: true, error: null }));
      
      // 選択された日の週の範囲を取得
      const { startDate, endDate } = getWeekRange(selectedDate);
      
      // 期間内の記録を取得
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      let records: any[] = [];
      
      if (selectedType === 'tenko') {
        records = await TenkoService.getRecordsByDateRange(user.id, startDateStr, endDateStr);
      }
      // 将来的に日常点検・運行記録も追加予定
      
      const vehicles = await VehicleService.getUserVehicles(user.id);
      const noOperationDays = await NoOperationService.getNoOperationDaysByDateRange(user.id, startDateStr, endDateStr);
      
      // PDF生成
      const pdfUri = await PDFService.generateWeeklyTenkoPDF({
        userProfile: profile,
        records,
        vehicles,
        noOperationDays,
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        weekLabel: `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日を含む週（${startDate.toLocaleDateString('ja-JP')}〜${endDate.toLocaleDateString('ja-JP')}）`,
        selectedDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD形式で渡す
      });
      
      // 生成完了、共有開始
      setPdfState(prev => ({ ...prev, isGenerating: false, isSharing: true }));
      
      // expo-sharingを使用（PDFファイルの共有に適している）
      try {
        const fileName = `${getTypeDisplayName()}_${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日週.pdf`;
        
        // AppState監視を設定してキャンセル検出を改善
        let appStateSubscription: any = null;
        let isShareCanceled = false;
        
        const setupAppStateListener = () => {
          const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active' && pdfState.isSharing) {
              // アプリがフォアグラウンドに戻った = 共有ダイアログがキャンセルされた可能性
              console.log('App returned to foreground - share dialog likely dismissed');
              isShareCanceled = true;
              setPdfState(prev => ({ ...prev, isSharing: false }));
              if (appStateSubscription) {
                appStateSubscription.remove();
                appStateSubscription = null;
              }
            }
          };
          
          appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
          
          // 5秒後にリスナーを自動削除
          setTimeout(() => {
            if (appStateSubscription) {
              appStateSubscription.remove();
              appStateSubscription = null;
            }
          }, 5000);
        };
        
        setupAppStateListener();
        
        // 短いタイムアウト付きで共有を実行
        await Promise.race([
          PDFService.sharePDF(pdfUri, fileName),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('共有タイムアウト')), 3000)
          )
        ]);
        
        // リスナーをクリーンアップ
        if (appStateSubscription) {
          appStateSubscription.remove();
        }
        
        if (!isShareCanceled) {
          console.log('PDF共有が完了しました');
        }
      } catch (shareError) {
        console.log('PDF共有エラーまたはキャンセル:', shareError);
        // エラーやキャンセルでも処理を続行
      }
      
    } catch (error) {
      console.error('PDF生成エラー:', error);
      Alert.alert('エラー', 'PDF生成に失敗しました');
      setPdfState(prev => ({ ...prev, error: 'PDF生成に失敗しました' }));
    } finally {
      setPdfState(prev => ({ ...prev, isGenerating: false, isSharing: false }));
    }
  };

  // タイプの表示名を取得
  const getTypeDisplayName = () => {
    switch (selectedType) {
      case 'tenko': return '点呼記録簿';
      case 'daily-check': return '日常点検記録';
      case 'operation-record': return '運行記録';
      default: return '記録';
    }
  };

  // 記録タイプの選択肢
  const recordTypes = [
    { value: 'tenko', label: '点呼記録簿', enabled: true },
    { value: 'daily-check', label: '日常点検記録（今後実装予定）', enabled: false },
    { value: 'operation-record', label: '運行記録（今後実装予定）', enabled: false },
  ];

  // 日付変更処理
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const { startDate, endDate } = getWeekRange(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>PDF出力</Text>
        </View>

        {/* 日付選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日付選択</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Feather name="calendar" size={20} color={colors.charcoal} />
            <Text style={styles.dateButtonText}>
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </Text>
            <Feather name="chevron-right" size={20} color={colors.darkGray} />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date(2030, 11, 31)}
                minimumDate={new Date(2020, 0, 1)}
                locale="ja-JP"
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerButtons}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerButtonText}>完了</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 記録タイプ選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出力する記録</Text>
          {recordTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                selectedType === type.value && styles.typeOptionSelected,
                !type.enabled && styles.typeOptionDisabled
              ]}
              onPress={() => type.enabled && setSelectedType(type.value as any)}
              disabled={!type.enabled}
            >
              <View style={styles.radioButton}>
                {selectedType === type.value && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={[
                styles.typeLabel,
                selectedType === type.value && styles.typeLabelSelected,
                !type.enabled && styles.typeLabelDisabled
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 出力期間表示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出力期間</Text>
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateRangeColumn}>
              <Text style={styles.dateRangeText}>
                {startDate.toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Text>
              <Text style={styles.dateRangeSeparator}>〜</Text>
              <Text style={styles.dateRangeText}>
                {endDate.toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Text>
            </View>
            <Text style={styles.dateRangeNote}>
              選択した日（{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日）を含む週（日〜土）
            </Text>
          </View>
        </View>

        {/* PDF生成ボタン */}
        <View style={styles.exportSection}>
          <TouchableOpacity
            onPress={generatePDF}
            disabled={pdfState.isGenerating || pdfState.isSharing}
            style={[
              styles.exportButton,
              (pdfState.isGenerating || pdfState.isSharing) && styles.exportButtonDisabled
            ]}
          >
            {pdfState.isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                <Text style={styles.exportButtonText}>PDF生成中...</Text>
              </>
            ) : pdfState.isSharing ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                <Text style={styles.exportButtonText}>共有準備中...</Text>
              </>
            ) : (
              <>
                <Feather name="file-text" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.exportButtonText}>PDFを生成</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.exportNote}>
            生成されたPDFは共有メニューから{'\n'}コンビニプリント等で印刷できます
          </Text>
        </View>
      </ScrollView>
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
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: colors.cream,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  section: {
    backgroundColor: colors.cream,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.beige,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: colors.charcoal,
    backgroundColor: '#fff',
  },
  typeOptionDisabled: {
    opacity: 0.5,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.darkGray,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  typeLabel: {
    fontSize: 16,
    color: colors.charcoal,
    flex: 1,
  },
  typeLabelSelected: {
    fontWeight: '600',
    color: colors.orange,
  },
  typeLabelDisabled: {
    color: colors.darkGray,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.charcoal,
    marginLeft: 12,
    fontWeight: '500',
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.orange,
    borderRadius: 8,
  },
  datePickerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    backgroundColor: colors.cream,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.beige,
  },
  dateRangeColumn: {
    alignItems: 'center',
    marginBottom: 6,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    textAlign: 'center',
  },
  dateRangeSeparator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginVertical: 4,
  },
  dateRangeNote: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  exportSection: {
    padding: 16,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: colors.orange,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  exportButtonDisabled: {
    backgroundColor: colors.beige,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  exportNote: {
    marginTop: 16,
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});