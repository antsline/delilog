import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();

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
    try {
      console.log('*** ログアウトボタン押下');
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
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
          {/* ベーシックプラン */}
          <TouchableOpacity 
            style={[styles.menuItem, styles.basicMenuItem]}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <View style={styles.menuContent}>
              <View style={styles.basicHeader}>
                <Text style={[styles.menuTitle, styles.basicTitle]}>ベーシックプラン</Text>
                <View style={styles.basicBadge}>
                  <Text style={styles.basicBadgeText}>★</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>基本機能が使える月額プラン</Text>
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
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            delayPressIn={0}
            delayPressOut={0}
          >
            <Text style={styles.signOutText}>ログアウト</Text>
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
  basicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  basicTitle: {
    color: colors.orange,
  },
  basicBadge: {
    marginLeft: 8,
    backgroundColor: colors.orange,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicBadgeText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: 'bold',
  },
});