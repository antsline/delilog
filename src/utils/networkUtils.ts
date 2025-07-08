import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { NetworkStatus } from '@/types/localDatabase';

export interface NetworkListener {
  id: string;
  callback: (status: NetworkStatus) => void;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private listeners: NetworkListener[] = [];
  private currentStatus: NetworkStatus = {
    isConnected: false,
    type: null,
    isInternetReachable: null,
    connectionQuality: 'unknown',
  };
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // 初期状態を取得
      const initialState = await NetInfo.fetch();
      this.updateStatus(initialState);

      // ネットワーク状態の変更を監視
      this.unsubscribe = NetInfo.addEventListener((state) => {
        this.updateStatus(state);
      });

      console.log('ネットワークマネージャー初期化完了');
    } catch (error) {
      console.error('ネットワークマネージャー初期化エラー:', error);
    }
  }

  private updateStatus(state: NetInfoState): void {
    const wasConnected = this.currentStatus.isConnected;
    const isNowConnected = state.isConnected ?? false;

    // 接続品質の判定
    let connectionQuality: NetworkStatus['connectionQuality'] = 'unknown';
    if (state.details && 'strength' in state.details) {
      const strength = state.details.strength as number;
      if (strength >= 4) connectionQuality = 'excellent';
      else if (strength >= 3) connectionQuality = 'good';
      else if (strength >= 1) connectionQuality = 'poor';
    } else if (isNowConnected) {
      connectionQuality = 'good'; // デフォルト
    }

    // 新しいステータスを作成
    const newStatus: NetworkStatus = {
      isConnected: isNowConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      connectionQuality,
      lastConnectedAt: isNowConnected && !wasConnected ? new Date() : this.currentStatus.lastConnectedAt,
      lastDisconnectedAt: !isNowConnected && wasConnected ? new Date() : this.currentStatus.lastDisconnectedAt,
    };

    const previousStatus = { ...this.currentStatus };
    this.currentStatus = newStatus;

    // リスナーに通知
    this.notifyListeners(newStatus, previousStatus);

    // デバッグログ
    if (__DEV__) {
      console.log('ネットワーク状態更新:', {
        type: state.type,
        isConnected: isNowConnected,
        isInternetReachable: state.isInternetReachable,
        quality: connectionQuality,
        changed: wasConnected !== isNowConnected,
      });
    }
  }

  private notifyListeners(currentStatus: NetworkStatus, previousStatus: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener.callback(currentStatus);
      } catch (error) {
        console.error(`ネットワークリスナーエラー [${listener.id}]:`, error);
      }
    });

    // 接続状態の変化をログ
    if (currentStatus.isConnected !== previousStatus.isConnected) {
      if (currentStatus.isConnected) {
        console.log('🟢 ネットワーク接続回復');
      } else {
        console.log('🔴 ネットワーク接続切断');
      }
    }
  }

  // 公開メソッド
  addListener(callback: (status: NetworkStatus) => void): string {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.push({ id, callback });
    
    // 現在の状態を即座に通知
    callback(this.currentStatus);
    
    return id;
  }

  removeListener(id: string): boolean {
    const initialLength = this.listeners.length;
    this.listeners = this.listeners.filter(listener => listener.id !== id);
    return this.listeners.length < initialLength;
  }

  getCurrentStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  isInternetReachable(): boolean {
    return this.currentStatus.isInternetReachable === true;
  }

  getConnectionType(): NetInfoStateType | null {
    return this.currentStatus.type;
  }

  getConnectionQuality(): NetworkStatus['connectionQuality'] {
    return this.currentStatus.connectionQuality;
  }

  // ネットワーク接続テスト
  async testConnection(timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 接続復旧を待機
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(listenerId);
        resolve(false);
      }, timeout);

      const listenerId = this.addListener((status) => {
        if (status.isConnected) {
          clearTimeout(timeoutId);
          this.removeListener(listenerId);
          resolve(true);
        }
      });
    });
  }

  // 統計情報の取得
  getNetworkStats(): {
    currentStatus: NetworkStatus;
    totalListeners: number;
    uptime: number | null;
    downtime: number | null;
  } {
    const now = new Date();
    let uptime: number | null = null;
    let downtime: number | null = null;

    if (this.currentStatus.isConnected && this.currentStatus.lastConnectedAt) {
      uptime = now.getTime() - this.currentStatus.lastConnectedAt.getTime();
    }

    if (!this.currentStatus.isConnected && this.currentStatus.lastDisconnectedAt) {
      downtime = now.getTime() - this.currentStatus.lastDisconnectedAt.getTime();
    }

    return {
      currentStatus: { ...this.currentStatus },
      totalListeners: this.listeners.length,
      uptime,
      downtime,
    };
  }

  // リソースのクリーンアップ
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
    console.log('ネットワークマネージャー破棄完了');
  }
}

// 便利な関数
export const getNetworkManager = (): NetworkManager => {
  return NetworkManager.getInstance();
};

// React Hook用のヘルパー関数
export const createNetworkStatusHook = () => {
  return (): NetworkStatus => {
    const [status, setStatus] = React.useState<NetworkStatus>(
      getNetworkManager().getCurrentStatus()
    );

    React.useEffect(() => {
      const manager = getNetworkManager();
      const listenerId = manager.addListener(setStatus);

      return () => {
        manager.removeListener(listenerId);
      };
    }, []);

    return status;
  };
};

// React import (動的import対応)
let React: any;
try {
  React = require('react');
} catch {
  // React未使用の場合は無視
}

// ネットワーク状態のフォーマット関数
export const formatNetworkStatus = (status: NetworkStatus): string => {
  const statusText = status.isConnected ? '接続中' : '切断中';
  const typeText = status.type ? `(${status.type})` : '';
  const qualityText = status.connectionQuality !== 'unknown' ? ` - ${status.connectionQuality}` : '';
  
  return `${statusText}${typeText}${qualityText}`;
};

// ネットワークタイプの判定
export const isWiFiConnection = (status: NetworkStatus): boolean => {
  return status.type === 'wifi';
};

export const isCellularConnection = (status: NetworkStatus): boolean => {
  return status.type === 'cellular';
};

export const isLowBandwidthConnection = (status: NetworkStatus): boolean => {
  return status.connectionQuality === 'poor' || status.type === 'cellular';
};

// エラー処理用の関数
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const networkErrorPatterns = [
    'network request failed',
    'network error',
    'connection timeout',
    'no internet connection',
    'fetch failed',
    'unable to connect',
  ];
  
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
};