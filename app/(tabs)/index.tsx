import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useTenko } from '@/hooks/useTenko';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { withPerformanceMonitoring, usePerformanceMonitor } from '@/utils/performanceMonitor';
import { 
  AccessibilityLabels, 
  AccessibilityHints, 
  AccessibilityRoles,
  createAccessibleProps,
  accessibilityManager 
} from '@/utils/accessibility';

function HomeScreen() {
  const { user, profile, loading: authLoading } = useAuth();
  const { todayStatus, loading: tenkoLoading, error, refreshData } = useTenko();
  const { checkMemoryUsage, recordScreenTransition } = usePerformanceMonitor();
  
  console.log('*** (tabs)/index.tsx レンダリング - 状態:', { 
    user: !!user, 
    userId: user?.id,
    profile: !!profile, 
    authLoading 
  });
  
  // 画面フォーカス時にデータを更新
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        refreshData();
      }
      checkMemoryUsage('HomeScreen');
    }, [user?.id]) // checkMemoryUsageも依存配列から削除
  );
  
  // 認証ローディング中は何も表示しない
  if (authLoading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.loadingText}>アプリを起動中...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const loading = tenkoLoading;

  // 今日の日付を取得
  const today = new Date();
  const todayString = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <SafeAreaView 
      style={styles.container}
      {...createAccessibleProps('ホーム画面', 'アプリのメイン画面です', AccessibilityRoles.FORM)}
    >
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* ヘッダー部分 */}
        <View 
          style={styles.header}
          {...createAccessibleProps(
            `おはようございます、${profile?.driver_name || 'ドライバー'}さん`,
            '今日の挨拶です',
            AccessibilityRoles.HEADER
          )}
        >
          <Text style={styles.greeting}>おはようございます</Text>
          <Text style={styles.userName}>{profile?.driver_name || 'ドライバー'}さん</Text>
        </View>

        {/* 日付カード */}
        <View 
          style={styles.dateCard}
          {...createAccessibleProps(
            `今日の日付、${todayString}`,
            '今日の日付を表示しています',
            AccessibilityRoles.TEXT
          )}
        >
          <Text style={styles.dateCardText}>{todayString}</Text>
        </View>

        {/* 同期状態表示 */}
        <SyncStatusIndicator showDetails={true} style={styles.syncIndicator} />

        {/* 今日のステータス */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>今日の状況</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.orange} size="large" />
              <Text style={styles.loadingText}>データを読み込み中...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <View style={styles.statusBox}>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabelInline}>業務前{'\n'}点呼</Text>
                  <View style={[
                    styles.statusTagInline, 
                    todayStatus.beforeCompleted ? styles.statusCompleted : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      todayStatus.beforeCompleted && styles.statusCompletedText
                    ]}>
                      {todayStatus.beforeCompleted ? '完了' : '未実施'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.statusBox}>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabelInline}>業務後{'\n'}点呼</Text>
                  <View style={[
                    styles.statusTagInline, 
                    todayStatus.afterCompleted ? styles.statusCompleted : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      todayStatus.afterCompleted && styles.statusCompletedText
                    ]}>
                      {todayStatus.afterCompleted ? '完了' : '未実施'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 点呼ボタン */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.taskCard, { backgroundColor: colors.orange }]}
            onPress={() => {
              console.log('*** 業務前点呼ボタン押下');
              const startTime = Date.now();
              router.push('/tenko-before');
              setTimeout(() => {
                recordScreenTransition('HomeScreen', 'TenkoBeforeScreen', Date.now() - startTime);
              }, 100);
            }}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
            {...createAccessibleProps(
              AccessibilityLabels.BEFORE_TENKO_BUTTON,
              AccessibilityHints.TENKO_BUTTON,
              AccessibilityRoles.BUTTON
            )}
          >
            <Text style={[styles.taskTitle, { color: colors.cream }]}>
              業務前点呼を記録
            </Text>
            <Text style={[styles.taskSubtitle, { color: colors.cream, opacity: 0.8 }]}>
              運行開始前の安全確認
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.taskCard, { backgroundColor: colors.charcoal }]}
            onPress={() => {
              console.log('*** 業務後点呼ボタン押下');
              const startTime = Date.now();
              router.push('/tenko-after');
              setTimeout(() => {
                recordScreenTransition('HomeScreen', 'TenkoAfterScreen', Date.now() - startTime);
              }, 100);
            }}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
            {...createAccessibleProps(
              AccessibilityLabels.AFTER_TENKO_BUTTON,
              AccessibilityHints.TENKO_BUTTON,
              AccessibilityRoles.BUTTON
            )}
          >
            <Text style={[styles.taskTitle, { color: colors.cream }]}>
              業務後点呼を記録
            </Text>
            <Text style={[styles.taskSubtitle, { color: colors.cream, opacity: 0.8 }]}>
              運行終了後の確認
            </Text>
          </TouchableOpacity>
        </View>

        {/* クイックアクション */}
        <View style={styles.quickActionSection}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          
          <View style={styles.quickActionGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <Text style={styles.quickActionText}>記録一覧</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Text style={styles.quickActionText}>PDF出力</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Text style={styles.quickActionText}>車両設定</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <Text style={styles.quickActionText}>プロフィール</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  dateCard: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: colors.beige,
    alignItems: 'center',
  },
  dateCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 16,
  },
  statusSection: {
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBox: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.beige,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabelInline: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    lineHeight: 18,
  },
  statusTagInline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: colors.beige,
  },
  statusCompleted: {
    backgroundColor: colors.orange,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  statusCompletedText: {
    color: colors.cream,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.darkGray,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.cream,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
  },
  actionSection: {
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  beforeButton: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  afterButton: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cream,
    marginBottom: 4,
  },
  actionButtonSubText: {
    fontSize: 14,
    color: colors.cream,
    opacity: 0.8,
  },
  quickActionSection: {
    marginBottom: 40,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
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
  taskSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  syncIndicator: {
    marginBottom: 24,
  },
});

// パフォーマンス監視付きでエクスポート
export default React.memo(withPerformanceMonitoring(HomeScreen, 'HomeScreen'));