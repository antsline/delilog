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
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
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

  // 画面フォーカス時にデータを更新（一時的に無効化）
  // useFocusEffect(
  //   React.useCallback(() => {
  //     optimizedRefreshData();
  //     optimizedMemoryCheck();
  //   }, [optimizedRefreshData, optimizedMemoryCheck])
  // );
  
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

        {/* 今日のステータス */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>今日の状況</Text>
          
          {loading ? (
            <LoadingState
              type="inline"
              message="データを読み込み中..."
              size="medium"
              color={colors.orange}
              animated={true}
            />
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
          <Text style={styles.sectionTitle}>点呼記録</Text>
          
          <View style={styles.actionButtonRow}>
            <Animated.View style={[styles.actionButtonWrapper, { transform: [{ scale: beforeButtonScale }] }]}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  router.push('/tenko-before');
                }}
                onPressIn={beforePressIn}
                onPressOut={beforePressOut}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                delayPressIn={0}
                delayPressOut={0}
                {...createAccessibleProps(
                  AccessibilityLabels.BEFORE_TENKO_BUTTON,
                  AccessibilityHints.TENKO_BUTTON,
                  AccessibilityRoles.BUTTON
                )}
              >
                <View style={styles.actionButtonIcon}>
                  <Feather name="truck" size={20} color={colors.charcoal} />
                </View>
                <Text style={styles.actionButtonTitle}>
                  業務前点呼
                </Text>
                <Text style={styles.actionButtonSubtitle}>
                  運行開始前の確認
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.actionButtonWrapper, { transform: [{ scale: afterButtonScale }] }]}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  router.push('/tenko-after');
                }}
                onPressIn={afterPressIn}
                onPressOut={afterPressOut}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                delayPressIn={0}
                delayPressOut={0}
                {...createAccessibleProps(
                  AccessibilityLabels.AFTER_TENKO_BUTTON,
                  AccessibilityHints.TENKO_BUTTON,
                  AccessibilityRoles.BUTTON
                )}
              >
                <View style={styles.actionButtonIcon}>
                  <Feather name="check-circle" size={20} color={colors.charcoal} />
                </View>
                <Text style={styles.actionButtonTitle}>
                  業務後点呼
                </Text>
                <Text style={styles.actionButtonSubtitle}>
                  運行終了後の確認
                </Text>
              </TouchableOpacity>
            </Animated.View>
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
    marginBottom: 32,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
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
    borderColor: colors.charcoal,
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
  syncIndicator: {
    marginBottom: 24,
  },
  trialBanner: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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