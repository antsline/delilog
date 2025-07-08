/**
 * データ管理画面
 * エクスポート、削除、バックアップ機能
 */

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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { dataExportService, ExportOptions } from '@/services/dataExportService';
import { dataManagementService, DataDeletionOptions, DataExportProgress } from '@/services/dataManagementService';
import { AnimatedButton } from '@/components/common/AnimatedButton';

export default function DataManagementScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [progressVisible, setProgressVisible] = React.useState(false);
  const [progress, setProgress] = React.useState<DataExportProgress>({
    step: '',
    progress: 0,
    completed: false,
  });

  const handleExportData = () => {
    Alert.alert(
      'データエクスポート',
      'エクスポートする期間を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '過去30日', onPress: () => exportData(30) },
        { text: '過去90日', onPress: () => exportData(90) },
        { text: '過去1年', onPress: () => exportData(365) },
      ]
    );
  };

  const exportData = async (days: number) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const options: ExportOptions = {
        format: 'pdf',
        dateRange: {
          startDate: startDateStr,
          endDate,
        },
        includeVehicleInfo: true,
        includePersonalInfo: true,
      };

      const result = await dataExportService.exportData(options);

      if (result.success && result.filePath) {
        Alert.alert(
          'エクスポート完了',
          'データのエクスポートが完了しました。ファイルを共有しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            { 
              text: '共有する', 
              onPress: () => dataExportService.shareExportedFile(result.filePath!) 
            },
          ]
        );
      } else {
        Alert.alert('エラー', result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
      Alert.alert('エラー', 'エクスポート中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedData = () => {
    Alert.alert(
      'データの部分削除',
      '削除するデータを選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '点呼記録のみ', onPress: () => deleteSelectedData('tenko') },
        { text: '車両データのみ', onPress: () => deleteSelectedData('vehicles') },
        { text: 'ローカルデータのみ', onPress: () => deleteSelectedData('local') },
      ]
    );
  };

  const deleteSelectedData = async (type: 'tenko' | 'vehicles' | 'local') => {
    if (!user) return;

    const options: DataDeletionOptions = {
      includeUserData: false,
      includeVehicleData: type === 'vehicles',
      includeTenkoRecords: type === 'tenko',
      includeLocalData: type === 'local',
      includeSecurityData: false,
    };

    const typeText = {
      tenko: '点呼記録',
      vehicles: '車両データ',
      local: 'ローカルデータ',
    }[type];

    Alert.alert(
      `${typeText}の削除`,
      `${typeText}を完全に削除します。この操作は取り消せません。本当に削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除する', 
          style: 'destructive',
          onPress: () => performDataDeletion(options, typeText)
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ アカウント完全削除',
      'アカウントとすべてのデータを完全に削除します。\n\n削除されるデータ:\n• 点呼記録\n• 車両情報\n• プロフィール\n• ローカルデータ\n• セキュリティ設定\n\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '完全削除する', 
          style: 'destructive',
          onPress: confirmAccountDeletion
        },
      ]
    );
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      '最終確認',
      'アカウントを削除すると、すべてのデータが失われ、復元できません。\n\n削除前にデータをエクスポートすることを強く推奨します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'データエクスポート', onPress: handleExportData },
        { 
          text: '削除実行', 
          style: 'destructive',
          onPress: () => performAccountDeletion()
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    if (!user) return;

    try {
      setProgressVisible(true);
      setProgress({ step: '削除処理を開始しています...', progress: 0, completed: false });

      await dataManagementService.deleteUserAccount(user.id, (progressData) => {
        setProgress(progressData);
      });

      // 削除完了後にログイン画面に遷移
      Alert.alert(
        '削除完了',
        'アカウントが正常に削除されました。アプリを再起動してください。',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setProgressVisible(false);
              router.replace('/');
            }
          }
        ]
      );
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      Alert.alert('エラー', 'アカウント削除中にエラーが発生しました');
      setProgressVisible(false);
    }
  };

  const performDataDeletion = async (options: DataDeletionOptions, dataType: string) => {
    if (!user) return;

    try {
      setProgressVisible(true);
      setProgress({ step: `${dataType}の削除を開始しています...`, progress: 0, completed: false });

      await dataManagementService.deleteSelectedData(user.id, options, (progressData) => {
        setProgress(progressData);
      });

      Alert.alert(
        '削除完了',
        `${dataType}が正常に削除されました。`,
        [
          { 
            text: 'OK', 
            onPress: () => setProgressVisible(false)
          }
        ]
      );
    } catch (error) {
      console.error('データ削除エラー:', error);
      Alert.alert('エラー', 'データ削除中にエラーが発生しました');
      setProgressVisible(false);
    }
  };

  const handleDataMigration = async () => {
    if (!user) return;

    Alert.alert(
      'データ移行準備',
      'データ移行用のファイルを作成します。この処理には時間がかかる場合があります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '作成開始', 
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await dataManagementService.prepareDataMigration(user.id);
              
              Alert.alert(
                '移行ファイル作成完了',
                `データサイズ: ${(result.dataSize / 1024).toFixed(1)} KB\n\nファイルを共有しますか？`,
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { 
                    text: '共有する', 
                    onPress: () => dataExportService.shareExportedFile(result.exportPath)
                  },
                ]
              );
            } catch (error) {
              Alert.alert('エラー', 'データ移行ファイルの作成に失敗しました');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

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
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>データ管理</Text>
        </View>

        {/* データエクスポートセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データエクスポート</Text>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Feather name="download" size={24} color={colors.orange} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>点呼記録をエクスポート</Text>
                <Text style={styles.cardDescription}>
                  PDF/CSV形式で点呼記録をバックアップできます
                </Text>
              </View>
            </View>
            <AnimatedButton
              title="エクスポート開始"
              onPress={handleExportData}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="small"
            />
          </View>
        </View>

        {/* データ移行セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ移行</Text>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Feather name="smartphone" size={24} color={colors.charcoal} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>機種変更用データ作成</Text>
                <Text style={styles.cardDescription}>
                  新しい端末でのデータ復元用ファイルを作成
                </Text>
              </View>
            </View>
            <AnimatedButton
              title="移行データ作成"
              onPress={handleDataMigration}
              disabled={isLoading}
              loading={isLoading}
              variant="secondary"
              size="small"
            />
          </View>
        </View>

        {/* データ削除セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ削除</Text>
          
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Feather name="trash-2" size={24} color={colors.orange} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>部分的なデータ削除</Text>
                <Text style={styles.cardDescription}>
                  特定のデータのみを削除できます
                </Text>
              </View>
            </View>
            <AnimatedButton
              title="選択削除"
              onPress={handleDeleteSelectedData}
              disabled={isLoading}
              variant="secondary"
              size="small"
            />
          </View>

          <View style={[styles.card, styles.dangerCard]}>
            <View style={styles.cardContent}>
              <Feather name="alert-triangle" size={24} color={colors.error || '#F44336'} />
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, styles.dangerText]}>アカウント完全削除</Text>
                <Text style={styles.cardDescription}>
                  すべてのデータを完全に削除します（復元不可）
                </Text>
              </View>
            </View>
            <AnimatedButton
              title="アカウント削除"
              onPress={handleDeleteAccount}
              disabled={isLoading}
              variant="danger"
              size="small"
            />
          </View>
        </View>

        {/* 注意事項 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>重要な注意事項</Text>
          <Text style={styles.noteText}>
            • データの削除は取り消せません
          </Text>
          <Text style={styles.noteText}>
            • 削除前には必ずデータをエクスポートしてください
          </Text>
          <Text style={styles.noteText}>
            • 法令により1年間の保存が義務付けられています
          </Text>
          <Text style={styles.noteText}>
            • 不明な点がある場合はサポートにお問い合わせください
          </Text>
        </View>
      </ScrollView>

      {/* プログレスモーダル */}
      <Modal
        visible={progressVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.progressOverlay}>
          <View style={styles.progressModal}>
            <ActivityIndicator color={colors.orange} size="large" />
            <Text style={styles.progressStep}>{progress.step}</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress.progress}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(progress.progress)}%</Text>
            {progress.error && (
              <Text style={styles.progressError}>{progress.error}</Text>
            )}
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.beige,
    marginBottom: 12,
  },
  dangerCard: {
    borderColor: colors.error || '#F44336',
    backgroundColor: '#FFF5F5',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  dangerText: {
    color: colors.error || '#F44336',
  },
  cardDescription: {
    fontSize: 12,
    color: colors.darkGray,
    lineHeight: 16,
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
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
  },
  progressStep: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '600',
  },
  progressError: {
    fontSize: 12,
    color: colors.error || '#F44336',
    textAlign: 'center',
    marginTop: 8,
  },
});