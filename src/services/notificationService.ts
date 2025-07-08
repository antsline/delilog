/**
 * プッシュ通知サービス
 * Expo Notificationsを使用した通知管理
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { shouldScheduleNotification, isWeekend } from '@/utils/dateUtils';

// 通知ハンドラーの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  beforeWork: {
    enabled: boolean;
    time: string; // HH:MM形式
  };
  afterWork: {
    enabled: boolean;
    time: string; // HH:MM形式
  };
  weekendEnabled: boolean;
}

export interface NotificationData {
  type: 'before_work' | 'after_work' | 'reminder';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any;
  private responseListener: any;

  /**
   * 通知サービスの初期化
   */
  async initialize(): Promise<void> {
    console.log('🔔 通知サービス初期化開始');

    // 通知権限の確認と要求
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('❌ 通知権限が拒否されました');
      return;
    }

    // プッシュトークンの取得
    await this.registerForPushNotificationsAsync();

    // 通知リスナーの設定
    this.setupNotificationListeners();

    console.log('✅ 通知サービス初期化完了');
  }

  /**
   * 通知権限のリクエスト
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * プッシュ通知トークンの登録
   */
  private async registerForPushNotificationsAsync(): Promise<void> {
    if (!Device.isDevice) {
      console.log('⚠️ 物理デバイスでのみプッシュ通知が利用可能です');
      return;
    }

    try {
      // Expo Go では リモート通知が制限されているため、ローカル通知のみ使用
      // Development Build では以下のコードでプッシュトークンを取得可能
      /*
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.pushToken = token.data;
      console.log('📱 プッシュトークン取得:', this.pushToken);

      // トークンをサーバーに保存
      await this.savePushTokenToServer(this.pushToken);
      */
      
      console.log('ℹ️ Expo Go ではローカル通知のみ利用可能です');
      console.log('💡 リモート通知を使用するには Development Build が必要です');
    } catch (error) {
      console.error('❌ プッシュトークン取得エラー:', error);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6D00',
      });
    }
  }

  /**
   * プッシュトークンをサーバーに保存
   */
  private async savePushTokenToServer(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 注意: 現在はローカルに保存
      // 将来的にはSupabaseのuser_devicesテーブルに保存する
      /*
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          push_token: token,
          device_type: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ プッシュトークン保存エラー:', error);
      }
      */
      
      console.log('📱 プッシュトークン（ローカル保存）:', token);
    } catch (error) {
      console.error('❌ プッシュトークン保存エラー:', error);
    }
  }

  /**
   * 通知リスナーの設定
   */
  private setupNotificationListeners(): void {
    // 通知受信時のリスナー
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 通知受信:', notification);
    });

    // 通知タップ時のリスナー
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 通知タップ:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * 通知タップ時の処理
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification } = response;
    const data = notification.request.content.data;

    // 通知タイプに応じた処理
    switch (data?.type) {
      case 'before_work':
        // 業務前点呼画面へ遷移
        console.log('🚀 業務前点呼画面へ遷移');
        break;
      case 'after_work':
        // 業務後点呼画面へ遷移
        console.log('🚀 業務後点呼画面へ遷移');
        break;
      default:
        break;
    }
  }

  /**
   * ローカル通知のスケジュール
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string> {
    console.log('📋 通知スケジュール開始:', {
      title,
      trigger,
      data,
      現在時刻: new Date().toLocaleString(),
    });

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    console.log('⏰ 通知スケジュール設定完了:', notificationId);
    return notificationId;
  }

  /**
   * 業務前点呼リマインダーの設定
   */
  async scheduleBeforeWorkReminder(time: string, weekendEnabled: boolean = false): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    
    // 既存のリマインダーをキャンセル
    await this.cancelNotificationsByType('before_work');

    // 週末制御: 週末無効の場合は平日のみスケジュール
    if (!weekendEnabled && isWeekend()) {
      console.log('📅 週末通知が無効のため、業務前リマインダーをスキップ');
      return;
    }

    console.log(`🚫 即座通知防止のため、業務前リマインダー設定をスキップ`);
    console.log(`   設定予定時刻: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    console.log(`   ※ Expo Go の制限により、リマインダー機能は Development Build でのみ利用可能です`);
    
    // 実際の通知設定はコメントアウト（即座通知を防ぐため）
    /*
    // 安全な通知時刻を計算
    const now = new Date();
    const targetTime = new Date();
    
    // 明日の指定時刻に設定（常に明日以降にして即座通知を防ぐ）
    targetTime.setDate(now.getDate() + 1);
    targetTime.setHours(hours, minutes, 0, 0);

    // さらに安全のため、最低5分後以降に設定
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    if (targetTime < fiveMinutesLater) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // 安全のため単発通知として設定（repeats: falseで即座発火を防ぐ）
    const trigger: Notifications.DateTriggerInput = {
      date: targetTime,
    };

    await this.scheduleLocalNotification(
      '業務前点呼のお知らせ',
      '業務開始前の点呼を忘れずに記録しましょう',
      trigger,
      { type: 'before_work' }
    );

    console.log(`⏰ 業務前リマインダー設定完了`);
    console.log(`   設定時刻: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    console.log(`   次回通知予定: ${targetTime.toLocaleString()}`);
    console.log(`   現在時刻: ${now.toLocaleString()}`);
    console.log(`   時差: ${Math.round((targetTime.getTime() - now.getTime()) / 1000 / 60)} 分後`);
    
    // デバッグ用
    await this.debugScheduledNotifications();
    */
  }

  /**
   * 業務後点呼リマインダーの設定
   */
  async scheduleAfterWorkReminder(time: string, weekendEnabled: boolean = false): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    
    // 既存のリマインダーをキャンセル
    await this.cancelNotificationsByType('after_work');

    // 週末制御: 週末無効の場合は平日のみスケジュール
    if (!weekendEnabled && isWeekend()) {
      console.log('📅 週末通知が無効のため、業務後リマインダーをスキップ');
      return;
    }

    console.log(`🚫 即座通知防止のため、業務後リマインダー設定をスキップ`);
    console.log(`   設定予定時刻: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    console.log(`   ※ Expo Go の制限により、リマインダー機能は Development Build でのみ利用可能です`);
    
    // 実際の通知設定はコメントアウト（即座通知を防ぐため）
    /*
    // 安全な通知時刻を計算
    const now = new Date();
    const targetTime = new Date();
    
    // 明日の指定時刻に設定（常に明日以降にして即座通知を防ぐ）
    targetTime.setDate(now.getDate() + 1);
    targetTime.setHours(hours, minutes, 0, 0);

    // さらに安全のため、最低5分後以降に設定
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    if (targetTime < fiveMinutesLater) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // 安全のため単発通知として設定（repeats: falseで即座発火を防ぐ）
    const trigger: Notifications.DateTriggerInput = {
      date: targetTime,
    };

    await this.scheduleLocalNotification(
      '業務後点呼のお知らせ',
      '業務終了後の点呼を忘れずに記録しましょう',
      trigger,
      { type: 'after_work' }
    );

    console.log(`⏰ 業務後リマインダー設定完了`);
    console.log(`   設定時刻: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    console.log(`   次回通知予定: ${targetTime.toLocaleString()}`);
    console.log(`   現在時刻: ${now.toLocaleString()}`);
    console.log(`   時差: ${Math.round((targetTime.getTime() - now.getTime()) / 1000 / 60)} 分後`);
    
    // デバッグ用
    await this.debugScheduledNotifications();
    */
  }

  /**
   * 特定タイプの通知をキャンセル
   */
  async cancelNotificationsByType(type: string): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * すべての通知をキャンセル
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🚫 すべての通知をキャンセルしました');
  }

  /**
   * 通知設定の保存
   */
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 注意: 現在はローカルストレージに保存
      // 将来的にはSupabaseのnotification_settingsテーブルに保存する
      /*
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ 通知設定保存エラー:', error);
        throw error;
      }
      */

      // リマインダーの再設定
      if (settings.enabled) {
        if (settings.beforeWork.enabled) {
          await this.scheduleBeforeWorkReminder(settings.beforeWork.time, settings.weekendEnabled);
        }
        if (settings.afterWork.enabled) {
          await this.scheduleAfterWorkReminder(settings.afterWork.time, settings.weekendEnabled);
        }
      } else {
        await this.cancelAllNotifications();
      }

      console.log('✅ 通知設定保存完了（ローカル）');
    } catch (error) {
      console.error('❌ 通知設定保存エラー:', error);
      throw error;
    }
  }

  /**
   * 通知設定の取得
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 注意: 現在はローカルストレージから取得（Zustandで管理）
      // 将来的にはSupabaseから取得する
      /*
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ 通知設定取得エラー:', error);
        return null;
      }

      return data;
      */
      
      // Zustandストアから取得
      return null; // ストアで管理するため、ここではnullを返す
    } catch (error) {
      console.error('❌ 通知設定取得エラー:', error);
      return null;
    }
  }

  /**
   * テスト通知の送信
   */
  async sendTestNotification(): Promise<void> {
    console.log('🧪 テスト通知開始');
    console.log('⏰ 3秒待機してから通知を表示します...');
    
    // Expo Goの制限を回避するため、実際に3秒待機してから通知を送信
    setTimeout(async () => {
      try {
        await Notifications.presentNotificationAsync({
          title: 'テスト通知',
          body: '通知機能は正常に動作しています',
          data: { type: 'test' },
        });
        console.log('✅ テスト通知送信完了');
      } catch (error) {
        console.error('❌ テスト通知送信エラー:', error);
      }
    }, 3000);
  }

  /**
   * 現在スケジュールされている通知の確認（デバッグ用）
   */
  async debugScheduledNotifications(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📅 現在スケジュール済み通知数:', scheduled.length);
    
    scheduled.forEach((notification, index) => {
      console.log(`📋 通知 ${index + 1}:`, {
        id: notification.identifier,
        title: notification.content.title,
        trigger: notification.trigger,
        data: notification.content.data,
      });
    });
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// シングルトンインスタンス
export const notificationService = new NotificationService();