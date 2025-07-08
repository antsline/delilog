/**
 * セキュリティ設定画面
 * 生体認証、自動ロック、暗号化設定
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useSecurityStore } from '@/store/securityStore';
import { AnimatedButton } from '@/components/common/AnimatedButton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function SecuritySettingsScreen() {
  const {
    settings,
    biometricAvailable,
    biometricTypes,
    securityLevel,
    isLoading,
    error,
    initialize,
    checkBiometricAvailability,
    authenticateWithBiometrics,
    toggleBiometricAuth,
    toggleAutoLock,
    setAutoLockDelay,
    runSecurityDiagnosis,
    clearError,
  } = useSecurityStore();

  React.useEffect(() => {
    initialize();
  }, []);

  React.useEffect(() => {
    if (error) {
      Alert.alert('エラー', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleBiometricToggle = async () => {
    if (!biometricAvailable && !settings.biometricEnabled) {
      Alert.alert(
        '生体認証が利用できません',
        '端末の設定で生体認証（Face ID / Touch ID）を有効にしてください。',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!settings.biometricEnabled) {
      // 生体認証を有効にする前にテスト認証
      const result = await authenticateWithBiometrics(
        '生体認証を有効にするために認証してください'
      );
      
      if (result.success) {
        await toggleBiometricAuth();
        Alert.alert('成功', '生体認証が有効になりました');
      }
    } else {
      // 生体認証を無効にする
      Alert.alert(
        '生体認証を無効にしますか？',
        'アプリのセキュリティレベルが下がります。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '無効にする', 
            style: 'destructive',
            onPress: async () => {
              await toggleBiometricAuth();
              Alert.alert('完了', '生体認証が無効になりました');
            }
          },
        ]
      );
    }
  };

  const handleAutoLockDelayChange = () => {
    const delays = [
      { label: '1分', value: 1 },
      { label: '5分', value: 5 },
      { label: '10分', value: 10 },
      { label: '15分', value: 15 },
      { label: '30分', value: 30 },
    ];

    Alert.alert(
      '自動ロック時間',
      '自動ロックまでの時間を選択してください',
      [
        ...delays.map(delay => ({
          text: delay.label + (settings.autoLockDelay === delay.value ? ' ✓' : ''),
          onPress: () => setAutoLockDelay(delay.value),
        })),
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  const handleTestBiometric = async () => {
    const result = await authenticateWithBiometrics('生体認証のテストです');
    
    if (result.success) {
      Alert.alert('成功', '生体認証が正常に動作しています');
    } else {
      Alert.alert('失敗', result.error || '認証に失敗しました');
    }
  };

  const handleSecurityDiagnosis = async () => {
    await runSecurityDiagnosis();
    Alert.alert(
      'セキュリティ診断結果',
      `現在のセキュリティレベル: ${getSecurityLevelText(securityLevel)}\n\n` +
      '詳細な結果がコンソールに出力されました。'
    );
  };

  const getSecurityLevelText = (level: string) => {
    switch (level) {
      case 'high': return '高（推奨）';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '不明';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return colors.success || '#4CAF50';
      case 'medium': return colors.orange;
      case 'low': return colors.error || '#F44336';
      default: return colors.darkGray;
    }
  };

  const getBiometricTypeText = () => {
    if (!biometricTypes.length) return '';
    
    // 最初の利用可能な認証タイプを表示
    const firstType = biometricTypes[0];
    switch (firstType) {
      case 1: return 'Touch ID';
      case 2: return 'Face ID';
      case 3: return 'Iris認証';
      default: return '生体認証';
    }
  };

  if (isLoading && !settings.biometricEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>セキュリティ設定を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="戻る"
            accessibilityHint="前の画面に戻ります"
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>セキュリティ設定</Text>
        </View>

        {/* セキュリティレベル表示 */}
        <View style={styles.securityLevelCard}>
          <View style={styles.securityLevelHeader}>
            <Feather 
              name="shield" 
              size={24} 
              color={getSecurityLevelColor(securityLevel)} 
            />
            <Text style={styles.securityLevelTitle}>現在のセキュリティレベル</Text>
          </View>
          <Text style={[
            styles.securityLevelText,
            { color: getSecurityLevelColor(securityLevel) }
          ]}>
            {getSecurityLevelText(securityLevel)}
          </Text>
        </View>

        {/* 生体認証設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生体認証</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>
                  {getBiometricTypeText() || '生体認証'}
                </Text>
                <Text style={styles.toggleDescription}>
                  {biometricAvailable 
                    ? 'アプリアクセス時に生体認証を要求' 
                    : '生体認証が利用できません'}
                </Text>
              </View>
              <Switch
                value={settings.biometricEnabled && biometricAvailable}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable || isLoading}
                trackColor={{ false: colors.lightGray, true: colors.orange }}
                thumbColor={colors.cream}
              />
            </View>

            {biometricAvailable && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestBiometric}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText}>認証テスト</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 自動ロック設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自動ロック</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>自動ロック</Text>
                <Text style={styles.toggleDescription}>
                  一定時間後にアプリをロック
                </Text>
              </View>
              <Switch
                value={settings.autoLockEnabled}
                onValueChange={toggleAutoLock}
                disabled={isLoading}
                trackColor={{ false: colors.lightGray, true: colors.orange }}
                thumbColor={colors.cream}
              />
            </View>

            {settings.autoLockEnabled && (
              <TouchableOpacity
                style={styles.delaySelector}
                onPress={handleAutoLockDelayChange}
                disabled={isLoading}
              >
                <Text style={styles.delaySelectorLabel}>ロック時間</Text>
                <Text style={styles.delaySelectorValue}>
                  {settings.autoLockDelay}分
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* データ暗号化設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ保護</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>データ暗号化</Text>
                <Text style={styles.toggleDescription}>
                  保存データを暗号化して保護（推奨）
                </Text>
              </View>
              <Switch
                value={settings.encryptionEnabled}
                onValueChange={(value) => {
                  // 暗号化は常に有効にすることを推奨
                  if (!value) {
                    Alert.alert(
                      '注意',
                      'データ暗号化を無効にするとセキュリティが低下します。有効にしておくことを強く推奨します。',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                disabled={true} // 暗号化は常に有効
                trackColor={{ false: colors.lightGray, true: colors.orange }}
                thumbColor={colors.cream}
              />
            </View>
          </View>
        </View>

        {/* セキュリティ診断 */}
        <View style={styles.section}>
          <AnimatedButton
            title="セキュリティ診断を実行"
            onPress={handleSecurityDiagnosis}
            disabled={isLoading}
            loading={isLoading}
            variant="secondary"
            size="medium"
            accessibilityLabel="セキュリティ診断を実行"
            accessibilityHint="現在のセキュリティ状態を診断します"
          />
        </View>

        {/* 注意事項 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>セキュリティについて</Text>
          <Text style={styles.noteText}>
            • 生体認証を有効にすることで、不正アクセスを防げます
          </Text>
          <Text style={styles.noteText}>
            • 自動ロック機能により、アプリを開いたまま忘れても安全です
          </Text>
          <Text style={styles.noteText}>
            • データ暗号化により、端末紛失時でも情報が保護されます
          </Text>
          <Text style={styles.noteText}>
            • 定期的にセキュリティ診断を実行することを推奨します
          </Text>
        </View>
      </ScrollView>

      {/* ローディングオーバーレイ */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      )}
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
  scrollContent: {
    paddingBottom: 40,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.darkGray,
  },
  securityLevelCard: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: colors.beige,
    alignItems: 'center',
  },
  securityLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginLeft: 8,
  },
  securityLevelText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.beige,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.darkGray,
  },
  testButton: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.orange,
  },
  delaySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  delaySelectorLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  delaySelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
  },
  noteSection: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});