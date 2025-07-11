import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user, hasProfile, loading, profile } = useAuth();

  console.log('*** Index.tsx (Clean) レンダリング - 状態:', { 
    user: !!user, 
    userId: user?.id,
    hasProfile, 
    loading, 
    profile: !!profile,
    profileId: profile?.id,
    profileName: profile?.driver_name
  });

  // 認証状態の変更を監視してリダイレクトを確実に実行
  React.useEffect(() => {
    if (!loading) {
      if (user && hasProfile) {
        console.log('*** Index.tsx useEffect: 認証済み&プロフィールあり - 強制リダイレクト', user.id);
        router.replace('/(tabs)');
      } else if (!user) {
        console.log('*** Index.tsx useEffect: 未認証 - ログイン画面へ強制リダイレクト');
        router.replace('/(auth)/login');
      }
    }
  }, [user, hasProfile, loading]);

  // デバッグ: タッチテスト画面への直接ナビゲーション
  if (__DEV__ && false) { // Change to true to enable touch test
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F2E8', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity 
          style={{ backgroundColor: 'red', padding: 20, borderRadius: 10, marginBottom: 20 }}
          onPress={() => router.push('/touch-fix-test')}
          delayPressIn={0}
          delayPressOut={0}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>Go to Touch Fix Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ backgroundColor: 'blue', padding: 20, borderRadius: 10 }}
          onPress={() => router.push('/simple-test')}
          delayPressIn={0}
          delayPressOut={0}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>Go to Simple Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ローディング中は空のビューを表示
  if (loading) {
    console.log('*** Index.tsx: ローディング中');
    return <View style={{ flex: 1, backgroundColor: '#F5F2E8' }} />;
  }

  // 認証済みでプロフィールがある場合はメイン画面へ（テストユーザーも含む）
  if (user && hasProfile) {
    console.log('*** Index.tsx: 認証済み&プロフィールあり - メイン画面へ <Redirect>', user.id);
    return <Redirect href="/(tabs)" />;
  }

  // 認証済みだがプロフィールがない場合は登録画面へ
  if (user && !hasProfile) {
    console.log('*** Index.tsx: プロフィールなしで登録画面へ <Redirect>');
    return <Redirect href="/(auth)/register" />;
  }

  // 未認証の場合はログイン画面へ
  console.log('*** Index.tsx: 未認証でログイン画面へ <Redirect>');
  return <Redirect href="/(auth)/login" />;
}