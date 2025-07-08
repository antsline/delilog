import { Stack } from 'expo-router';
import 'react-native-gesture-handler';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { accessibilityManager } from '@/utils/accessibility';
import { notificationService } from '@/services/notificationService';
import { useOfflineStore } from '@/store/offlineStore';
import { useSecurityStore } from '@/store/securityStore';
import React from 'react';

export default function RootLayout() {
  // アプリ起動完了時間を記録
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performanceMonitor.recordAppStartComplete();
    }, 100); // 初期レンダリング完了後に記録
    
    return () => clearTimeout(timer);
  }, []);

  // アクセシビリティマネージャー初期化
  React.useEffect(() => {
    // アクセシビリティマネージャーは自動初期化されるため、参照のみ
    console.log('♿ アクセシビリティ機能有効:', accessibilityManager.getScreenReaderEnabled());
  }, []);

  // 通知サービス初期化
  React.useEffect(() => {
    notificationService.initialize();
    
    return () => {
      notificationService.cleanup();
    };
  }, []);

  // オフラインストア初期化
  React.useEffect(() => {
    useOfflineStore.getState().initialize();
  }, []);

  // セキュリティストア初期化
  React.useEffect(() => {
    useSecurityStore.getState().initialize();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="tenko-before" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="tenko-after" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationDuration: 300,
        }}
      />
      <Stack.Screen name="touch-test" />
      <Stack.Screen name="simple-test" />
      <Stack.Screen name="touch-fix-test" />
      <Stack.Screen name="basic-button-test" />
    </Stack>
  );
}