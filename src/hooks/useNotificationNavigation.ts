/**
 * 通知タップ時のナビゲーション処理
 * 通知からアプリを開いた際の画面遷移を管理
 */

import React from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/hooks/useAuth';

export function useNotificationNavigation() {
  const { user } = useAuth();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  React.useEffect(() => {
    if (!lastNotificationResponse || !user) return;

    const { notification } = lastNotificationResponse;
    const data = notification.request.content.data;

    // 通知タイプに応じた画面遷移
    if (data?.type === 'before_work') {
      console.log('🚀 業務前点呼リマインダーから起動');
      router.push('/tenko-before');
    } else if (data?.type === 'after_work') {
      console.log('🚀 業務後点呼リマインダーから起動');
      router.push('/tenko-after');
    }
  }, [lastNotificationResponse, user]);
}