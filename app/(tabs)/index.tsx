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
  Alert,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useTenko } from '@/hooks/useTenko';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
// パフォーマンス関連を一時的に無効化
// import { withPerformanceMonitoring, usePerformanceMonitor } from '@/utils/performanceMonitor';
// import { useOptimizedCallback, useExpensiveCalculation, useOptimizationMetrics } from '@/hooks/useOptimizedPerformance';
// import { recordComponentOptimization } from '@/utils/performanceReporter';
import { useTapFeedback } from '@/hooks/useAnimations';
import { LoadingState } from '@/components/ui/LoadingStates';
import { 
  AccessibilityLabels, 
  AccessibilityHints, 
  AccessibilityRoles,
  createAccessibleProps,
  accessibilityManager 
} from '@/utils/accessibility';
import { useSubscriptionStatus } from '@/store/subscriptionStore';
import { FeatureLimitBanner, PremiumFeatureBlock } from '@/components/subscription/FeatureLimitBanner';

function HomeScreen() {
  const { user, profile, loading: authLoading } = useAuth();
  const { todayStatus, loading: tenkoLoading, error, refreshData } = useTenko();
  
  // デバッグ用: todayStatusの内容をログ出力
  React.useEffect(() => {
    console.log('*** Index.tsx todayStatus:', {
      beforeCompleted: todayStatus.beforeCompleted,
      afterCompleted: todayStatus.afterCompleted,
      canStartNewSession: todayStatus.canStartNewSession,
      hasActiveSession: !!todayStatus.activeSession,
      hasLatestCompleted: !!todayStatus.latestCompletedSession
    });
  }, [todayStatus]);
  const subscriptionStatus = useSubscriptionStatus();
  // パフォーマンス計測を一時的に無効化
  // const { checkMemoryUsage, recordScreenTransition } = usePerformanceMonitor();
  // const { recordRender, getMetrics } = useOptimizationMetrics('HomeScreen');

  // アニメーション設定（簡素化）
  const { scale: beforeButtonScale, onPressIn: beforePressIn, onPressOut: beforePressOut } = useTapFeedback();
  const { scale: afterButtonScale, onPressIn: afterPressIn, onPressOut: afterPressOut } = useTapFeedback();

  // 初回マウント時のみ実行（一時的に無効化）
  // React.useEffect(() => {
  //   recordComponentOptimization('HomeScreen');
  //   console.log('🎯 HomeScreen マウント完了');
  // }, []);

  // レンダリング計測を一時的に無効化
  // const renderRecorded = React.useRef(false);
  // React.useEffect(() => {
  //   if (!renderRecorded.current) {
  //     renderRecorded.current = true;
  //     recordRender();
  //   }
  // });
  
  // デバッグログを一時的に無効化
  // console.log('*** (tabs)/index.tsx レンダリング - 状態:', { 
  //   user: !!user, 
  //   userId: user?.id,
  //   profile: !!profile, 
  //   authLoading,
  //   isBasic: subscriptionStatus.isBasic
  // });
  
  // 最適化されたコールバック（一時的に無効化）
  // const optimizedRefreshData = useOptimizedCallback(
  //   () => {
  //     if (user) {
  //       refreshData();
  //     }
  //   },
  //   [user?.id, refreshData]
  // );

  // const optimizedMemoryCheck = useOptimizedCallback(
  //   () => {
  //     checkMemoryUsage('HomeScreen');
  //   },
  //   [checkMemoryUsage]
  // );

  // 画面フォーカス時にデータを更新
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('*** ホーム画面フォーカス - データを更新');
        refreshData();
      }
    }, [user?.id, refreshData])
  );
  
  // 認証ローディング中は改善されたローディング表示
  if (authLoading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState
          type="overlay"
          message="アプリを起動中..."
          size="large"
          color={colors.orange}
          animated={true}
        />
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

  // 時間帯に応じた挨拶を取得
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 10) {
      return 'おはようございます';
    } else if (hour >= 10 && hour < 17) {
      return 'おつかれさまです';
    } else if (hour >= 17 && hour < 21) {
      return 'おつかれさまです';
    } else {
      return 'おつかれさまです';
    }
  };

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
            `${getGreeting()}、${profile?.driver_name || 'ドライバー'}さん`,
            '今日の挨拶です',
            AccessibilityRoles.HEADER
          )}
        >
          <Text style={styles.greeting}>{getGreeting()}</Text>
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

        {/* ベーシックプラン状態表示 */}
        {!subscriptionStatus.isBasic && (
          <FeatureLimitBanner
            feature="records"
            currentUsage={0} // 実際は点呼記録数を取得
            limit={50}
            message="無料プランでは50件まで記録できます"
          />
        )}

        {/* トライアル表示 */}
        {subscriptionStatus.trialDaysRemaining !== null && subscriptionStatus.trialDaysRemaining > 0 && (
          <View style={styles.trialBanner}>
            <Text style={styles.trialText}>
              無料トライアル残り{subscriptionStatus.trialDaysRemaining}日
            </Text>
          </View>
        )}


        {/* 点呼ボタン */}
        <View style={styles.actionSection}>
          <View style={styles.actionButtonRow}>
            <Animated.View style={[styles.actionButtonWrapper, { transform: [{ scale: beforeButtonScale }] }]}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  todayStatus.beforeCompleted && styles.actionButtonCompleted,
                  todayStatus.beforeCompleted && todayStatus.canStartNewSession && styles.actionButtonDisabled
                ]}
                onPress={() => {
                  console.log('*** 業務前点呼ボタン押下時のstatus:', {
                    beforeCompleted: todayStatus.beforeCompleted,
                    afterCompleted: todayStatus.afterCompleted,
                    canStartNewSession: todayStatus.canStartNewSession,
                    hasActiveSession: !!todayStatus.activeSession,
                    hasCompletedSession: !!todayStatus.latestCompletedSession
                  });
                  
                  if (todayStatus.beforeCompleted && todayStatus.canStartNewSession) {
                    Alert.alert(
                      '新しい業務を開始してください',
                      '下の「次の業務を開始」ボタンを押してから業務前点呼を行ってください。',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  router.push('/tenko-before');
                }}
                onPressIn={!todayStatus.beforeCompleted ? beforePressIn : undefined}
                onPressOut={!todayStatus.beforeCompleted ? beforePressOut : undefined}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                delayPressIn={0}
                delayPressOut={0}
                disabled={todayStatus.beforeCompleted && todayStatus.canStartNewSession}
                {...createAccessibleProps(
                  AccessibilityLabels.BEFORE_TENKO_BUTTON,
                  todayStatus.beforeCompleted ? '記録済みです' : AccessibilityHints.TENKO_BUTTON,
                  AccessibilityRoles.BUTTON
                )}
              >
                <View style={[
                  styles.actionButtonIcon,
                  todayStatus.beforeCompleted && styles.actionButtonIconCompleted,
                  todayStatus.beforeCompleted && todayStatus.canStartNewSession && styles.actionButtonIconDisabled
                ]}>
                  <Feather 
                    name={todayStatus.beforeCompleted ? "check-circle" : "truck"} 
                    size={20} 
                    color={
                      todayStatus.beforeCompleted 
                        ? colors.orange 
                        : colors.charcoal
                    } 
                  />
                </View>
                <Text style={[
                  styles.actionButtonTitle,
                  todayStatus.beforeCompleted && styles.actionButtonTitleCompleted,
                  todayStatus.beforeCompleted && todayStatus.canStartNewSession && styles.actionButtonTitleDisabled
                ]}>
                  業務前点呼
                </Text>
                <Text style={[
                  styles.actionButtonSubtitle,
                  todayStatus.beforeCompleted && styles.actionButtonSubtitleCompleted,
                  todayStatus.beforeCompleted && todayStatus.canStartNewSession && styles.actionButtonSubtitleDisabled
                ]}>
                  {todayStatus.beforeCompleted && todayStatus.beforeRecord
                    ? `${new Date(todayStatus.beforeRecord.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 記録済み`
                    : '運行開始前の確認'
                  }
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.actionButtonWrapper, { transform: [{ scale: afterButtonScale }] }]}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  todayStatus.afterCompleted && styles.actionButtonCompleted,
                  (!todayStatus.beforeCompleted || (todayStatus.afterCompleted && !todayStatus.canStartNewSession)) && styles.actionButtonDisabled
                ]}
                onPress={() => {
                  console.log('*** 業務後点呼ボタン押下時のstatus:', {
                    beforeCompleted: todayStatus.beforeCompleted,
                    afterCompleted: todayStatus.afterCompleted,
                    canStartNewSession: todayStatus.canStartNewSession
                  });
                  
                  if (!todayStatus.beforeCompleted) {
                    Alert.alert(
                      '業務前点呼が必要です',
                      '業務後点呼を行う前に、業務前点呼を完了してください。',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  if (todayStatus.afterCompleted && !todayStatus.canStartNewSession) {
                    Alert.alert(
                      '業務後点呼は完了済みです',
                      '既に業務後点呼が完了しています。',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  router.push('/tenko-after');
                }}
                onPressIn={todayStatus.beforeCompleted && (!todayStatus.afterCompleted || todayStatus.canStartNewSession) ? afterPressIn : undefined}
                onPressOut={todayStatus.beforeCompleted && (!todayStatus.afterCompleted || todayStatus.canStartNewSession) ? afterPressOut : undefined}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                delayPressIn={0}
                delayPressOut={0}
                disabled={!todayStatus.beforeCompleted || (todayStatus.afterCompleted && !todayStatus.canStartNewSession)}
                {...createAccessibleProps(
                  AccessibilityLabels.AFTER_TENKO_BUTTON,
                  !todayStatus.beforeCompleted ? '業務前点呼を先に完了してください' : todayStatus.afterCompleted ? '業務後点呼は完了済みです' : AccessibilityHints.TENKO_BUTTON,
                  AccessibilityRoles.BUTTON
                )}
              >
                <View style={[
                  styles.actionButtonIcon,
                  todayStatus.afterCompleted && styles.actionButtonIconCompleted,
                  (!todayStatus.beforeCompleted || (todayStatus.afterCompleted && !todayStatus.canStartNewSession)) && styles.actionButtonIconDisabled
                ]}>
                  <Feather 
                    name={todayStatus.afterCompleted ? "check-circle" : "clipboard"} 
                    size={20} 
                    color={
                      todayStatus.afterCompleted 
                        ? colors.orange 
                        : !todayStatus.beforeCompleted
                          ? colors.darkGray 
                          : colors.charcoal
                    } 
                  />
                </View>
                <Text style={[
                  styles.actionButtonTitle,
                  todayStatus.afterCompleted && styles.actionButtonTitleCompleted,
                  (!todayStatus.beforeCompleted || (todayStatus.afterCompleted && !todayStatus.canStartNewSession)) && styles.actionButtonTitleDisabled
                ]}>
                  業務後点呼
                </Text>
                <Text style={[
                  styles.actionButtonSubtitle,
                  todayStatus.afterCompleted && styles.actionButtonSubtitleCompleted,
                  (!todayStatus.beforeCompleted || (todayStatus.afterCompleted && !todayStatus.canStartNewSession)) && styles.actionButtonSubtitleDisabled
                ]}>
                  {todayStatus.afterCompleted && todayStatus.afterRecord
                    ? `${new Date(todayStatus.afterRecord.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 記録済み`
                    : !todayStatus.beforeCompleted
                      ? '業務前点呼を先に実施'
                      : '運行終了後の確認'
                  }
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* 次の業務開始ボタン */}
          {todayStatus.beforeCompleted && todayStatus.afterCompleted && todayStatus.canStartNewSession && (
            <View style={styles.nextBusinessSection}>
              <TouchableOpacity 
                style={styles.nextBusinessButton}
                onPress={() => {
                  console.log('*** 次の業務開始ボタン押下');
                  // 新しいセッションを開始可能にする処理
                  router.push('/tenko-before');
                }}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <View style={styles.nextBusinessButtonContent}>
                  <Feather name="plus-circle" size={20} color={colors.charcoal} />
                  <Text style={styles.nextBusinessButtonText}>次の業務を開始</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: spacing.card,
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
    marginBottom: spacing.section,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: spacing.card,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.beige,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.cream,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  actionButtonCompleted: {
    backgroundColor: colors.orange + '10',
    borderColor: colors.orange,
  },
  actionButtonIconCompleted: {
    backgroundColor: colors.orange + '20',
  },
  actionButtonTitleCompleted: {
    color: colors.orange,
  },
  actionButtonSubtitleCompleted: {
    color: colors.orange,
    fontWeight: '600',
  },
  nextBusinessSection: {
    marginTop: spacing.card,
    alignItems: 'stretch',
  },
  nextBusinessButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.beige,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBusinessButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBusinessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginLeft: 8,
  },
  actionButtonDisabled: {
    backgroundColor: colors.beige + '40',
    borderColor: colors.darkGray,
    opacity: 0.6,
  },
  actionButtonIconDisabled: {
    backgroundColor: colors.darkGray + '20',
  },
  actionButtonTitleDisabled: {
    color: colors.darkGray,
  },
  actionButtonSubtitleDisabled: {
    color: colors.darkGray,
    fontStyle: 'italic',
  },
  syncIndicator: {
    marginBottom: spacing.card,
  },
  trialBanner: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.card,
    alignItems: 'center',
  },
  trialText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
});

// 一時的にシンプルなエクスポート
export default HomeScreen;