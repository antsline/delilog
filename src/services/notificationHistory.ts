/**
 * 通知履歴管理サービス
 * 送信した通知の履歴を記録・管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationHistoryItem {
  id: string;
  type: 'before_work' | 'after_work' | 'test';
  title: string;
  body: string;
  scheduledTime: string; // ISO string
  sentTime?: string; // ISO string
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  errorMessage?: string;
  tappedTime?: string; // ISO string - ユーザーがタップした時刻
  actionTaken?: 'opened_app' | 'opened_tenko' | 'dismissed';
}

class NotificationHistoryService {
  private readonly STORAGE_KEY = 'notification_history';
  private readonly MAX_HISTORY_ITEMS = 100; // 最大保持件数

  /**
   * 通知履歴の記録
   */
  async recordNotification(item: Omit<NotificationHistoryItem, 'id'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const newItem: NotificationHistoryItem = {
        ...item,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // 新しいアイテムを先頭に追加
      const updatedHistory = [newItem, ...history];

      // 最大件数を超えた場合は古いものを削除
      if (updatedHistory.length > this.MAX_HISTORY_ITEMS) {
        updatedHistory.splice(this.MAX_HISTORY_ITEMS);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
      console.log('📝 通知履歴記録:', newItem.type, newItem.status);
    } catch (error) {
      console.error('❌ 通知履歴記録エラー:', error);
    }
  }

  /**
   * 通知履歴の取得
   */
  async getHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!historyJson) return [];

      const history: NotificationHistoryItem[] = JSON.parse(historyJson);
      return history.sort((a, b) => 
        new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
      );
    } catch (error) {
      console.error('❌ 通知履歴取得エラー:', error);
      return [];
    }
  }

  /**
   * 特定期間の履歴を取得
   */
  async getHistoryByDateRange(startDate: Date, endDate: Date): Promise<NotificationHistoryItem[]> {
    const allHistory = await this.getHistory();
    
    return allHistory.filter(item => {
      const itemDate = new Date(item.scheduledTime);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  /**
   * 今日の通知履歴を取得
   */
  async getTodayHistory(): Promise<NotificationHistoryItem[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return this.getHistoryByDateRange(startOfDay, endOfDay);
  }

  /**
   * 通知のステータス更新
   */
  async updateNotificationStatus(
    id: string, 
    status: NotificationHistoryItem['status'],
    errorMessage?: string
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        history[itemIndex].status = status;
        if (status === 'sent') {
          history[itemIndex].sentTime = new Date().toISOString();
        }
        if (errorMessage) {
          history[itemIndex].errorMessage = errorMessage;
        }
        
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        console.log('📝 通知ステータス更新:', id, status);
      }
    } catch (error) {
      console.error('❌ 通知ステータス更新エラー:', error);
    }
  }

  /**
   * 通知タップの記録
   */
  async recordNotificationTap(
    notificationId: string,
    actionTaken: NotificationHistoryItem['actionTaken']
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const itemIndex = history.findIndex(item => 
        item.id === notificationId || 
        item.scheduledTime === notificationId // 代替識別子として使用
      );
      
      if (itemIndex !== -1) {
        history[itemIndex].tappedTime = new Date().toISOString();
        history[itemIndex].actionTaken = actionTaken;
        
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        console.log('👆 通知タップ記録:', notificationId, actionTaken);
      }
    } catch (error) {
      console.error('❌ 通知タップ記録エラー:', error);
    }
  }

  /**
   * 統計情報の取得
   */
  async getStatistics(days: number = 30): Promise<{
    totalSent: number;
    totalTapped: number;
    tapRate: number;
    byType: Record<string, { sent: number; tapped: number; tapRate: number }>;
    recentActivity: NotificationHistoryItem[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const history = await this.getHistoryByDateRange(startDate, endDate);
      const sentHistory = history.filter(item => item.status === 'sent');
      const tappedHistory = sentHistory.filter(item => item.tappedTime);
      
      // タイプ別統計
      const byType: Record<string, { sent: number; tapped: number; tapRate: number }> = {};
      
      ['before_work', 'after_work', 'test'].forEach(type => {
        const typeSent = sentHistory.filter(item => item.type === type);
        const typeTapped = typeSent.filter(item => item.tappedTime);
        
        byType[type] = {
          sent: typeSent.length,
          tapped: typeTapped.length,
          tapRate: typeSent.length > 0 ? (typeTapped.length / typeSent.length) * 100 : 0,
        };
      });
      
      return {
        totalSent: sentHistory.length,
        totalTapped: tappedHistory.length,
        tapRate: sentHistory.length > 0 ? (tappedHistory.length / sentHistory.length) * 100 : 0,
        byType,
        recentActivity: history.slice(0, 10), // 最新10件
      };
    } catch (error) {
      console.error('❌ 統計情報取得エラー:', error);
      return {
        totalSent: 0,
        totalTapped: 0,
        tapRate: 0,
        byType: {},
        recentActivity: [],
      };
    }
  }

  /**
   * 古い履歴のクリーンアップ
   */
  async cleanupOldHistory(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const history = await this.getHistory();
      const filteredHistory = history.filter(item => 
        new Date(item.scheduledTime) >= cutoffDate
      );
      
      if (filteredHistory.length !== history.length) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
        const deletedCount = history.length - filteredHistory.length;
        console.log(`🧹 古い通知履歴をクリーンアップ: ${deletedCount}件削除`);
      }
    } catch (error) {
      console.error('❌ 履歴クリーンアップエラー:', error);
    }
  }

  /**
   * すべての履歴をクリア
   */
  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ 通知履歴をすべてクリア');
    } catch (error) {
      console.error('❌ 履歴クリアエラー:', error);
    }
  }
}

// シングルトンインスタンス
export const notificationHistoryService = new NotificationHistoryService();