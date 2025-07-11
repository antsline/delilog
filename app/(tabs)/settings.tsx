import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/store/subscriptionStore';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const { isBasic, subscriptionStatus, trialDaysRemaining, isLoading } = useSubscriptionStatus();

  const handleVehicleManagement = () => {
    console.log('*** 車両管理ボタン押下');
    router.push('/settings/vehicles');
  };

  const handleProfileEdit = () => {
    console.log('*** プロフィール編集ボタン押下');
    router.push('/settings/profile');
  };

  const handleAbout = () => {
    console.log('*** アプリについてボタン押下');
    router.push('/settings/about');
  };

  const handleNotifications = () => {
    console.log('*** 通知設定ボタン押下');
    router.push('/settings/notifications');
  };

  const handleSecurity = () => {
    console.log('*** セキュリティ設定ボタン押下');
    router.push('/settings/security');
  };

  const handleDataManagement = () => {
    console.log('*** データ管理ボタン押下');
    router.push('/settings/data-management');
  };


  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト確認',
      'ログアウトしてもよろしいですか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('*** ログアウト実行');
              setIsSigningOut(true);
              await signOut();
              console.log('*** ログアウト成功 - 手動でログイン画面にリダイレクト');
              // 手動でログイン画面にリダイレクト
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('ログアウトエラー:', error);
              setIsSigningOut(false);
              Alert.alert(
                'エラー',
                'ログアウトに失敗しました。もう一度お試しください。'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
        </View>

        {/* 設定メニュー */}
        <View style={styles.menuSection}>
          {/* 現在のプラン表示 */}
          <TouchableOpacity 
            style={[styles.menuItem, isBasic ? styles.basicMenuItem : styles.freeMenuItem]}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <View style={styles.planHeader}>
                <Text style={[styles.menuTitle, isBasic ? styles.basicTitle : styles.freeTitle]}>
                  {isBasic ? 'ベーシックプラン' : 'フリープラン'}
                </Text>
                <View style={[styles.planBadge, isBasic ? styles.basicBadge : styles.freeBadge]}>
                  <Text style={[styles.planBadgeText, isBasic ? styles.basicBadgeText : styles.freeBadgeText]}>
                    {isBasic ? '★' : '無料'}
                  </Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>
                {isBasic ? '基本機能が使える月額プラン' : 'プランを変更して機能を拡張'}
                {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
                  <Text style={styles.trialIndicator}> • トライアル残り{trialDaysRemaining}日</Text>
                )}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* 車両管理 */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleVehicleManagement}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>車両管理</Text>
              <Text style={styles.menuSubtitle}>車両の追加・編集・削除</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* プロフィール編集 */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleProfileEdit}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>プロフィール編集</Text>
              <Text style={styles.menuSubtitle}>個人情報・会社情報の変更</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* 通知設定 */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleNotifications}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>通知設定</Text>
              <Text style={styles.menuSubtitle}>点呼リマインダーの設定</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* セキュリティ設定 */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleSecurity}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>セキュリティ設定</Text>
              <Text style={styles.menuSubtitle}>生体認証・データ保護の設定</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* データ管理 */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleDataManagement}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>データ管理</Text>
              <Text style={styles.menuSubtitle}>エクスポート・削除・バックアップ</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* アプリについて */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleAbout}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>アプリについて</Text>
              <Text style={styles.menuSubtitle}>バージョン情報・利用規約</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ログアウトボタン */}
        <View style={styles.signOutSection}>
          <TouchableOpacity 
            style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
            onPress={handleSignOut}
            activeOpacity={0.8}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <ActivityIndicator size="small" color={colors.cream} />
            ) : (
              <Text style={styles.signOutText}>ログアウト</Text>
            )}
          </TouchableOpacity>
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
  header: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.darkGray,
    fontWeight: '300',
  },
  signOutSection: {
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: colors.charcoal,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signOutButtonDisabled: {
    backgroundColor: colors.darkGray,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  basicMenuItem: {
    borderColor: colors.orange,
    borderWidth: 2,
    backgroundColor: colors.orange + '05',
  },
  freeMenuItem: {
    borderColor: colors.darkGray,
    borderWidth: 2,
    backgroundColor: colors.darkGray + '05',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  basicTitle: {
    color: colors.orange,
  },
  freeTitle: {
    color: colors.darkGray,
  },
  planBadge: {
    marginLeft: 8,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicBadge: {
    backgroundColor: colors.orange,
  },
  freeBadge: {
    backgroundColor: colors.darkGray,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  basicBadgeText: {
    color: colors.cream,
  },
  freeBadgeText: {
    color: colors.cream,
  },
  trialIndicator: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
});