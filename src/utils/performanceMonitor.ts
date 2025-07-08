/**
 * パフォーマンス監視ユーティリティ
 * アプリの起動時間、画面遷移、メモリ使用量を計測
 */

import React from 'react';

interface PerformanceMetrics {
  appStartTime?: number;
  screenTransitions: Map<string, number>;
  memoryUsage: Map<string, number>;
  renderTimes: Map<string, number>;
}

interface PerformanceEvent {
  type: 'app_start' | 'screen_transition' | 'memory_check' | 'render_time';
  name: string;
  timestamp: number;
  value?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    screenTransitions: new Map(),
    memoryUsage: new Map(),
    renderTimes: new Map(),
  };
  private events: PerformanceEvent[] = [];
  private appStartTime: number;
  
  private constructor() {
    this.appStartTime = Date.now();
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring(): void {
    // アプリ起動時間の記録
    this.recordEvent({
      type: 'app_start',
      name: 'app_initialization',
      timestamp: this.appStartTime,
    });

    console.log('📊 Performance Monitor 初期化完了');
  }

  /**
   * アプリ起動完了時間を記録
   */
  recordAppStartComplete(): void {
    const startupTime = Date.now() - this.appStartTime;
    this.metrics.appStartTime = startupTime;
    
    this.recordEvent({
      type: 'app_start',
      name: 'app_start_complete',
      timestamp: Date.now(),
      value: startupTime,
    });

    console.log(`⏱️ アプリ起動時間: ${startupTime}ms`);
    
    if (startupTime > 3000) {
      console.warn('⚠️ 起動時間が目標の3秒を超過しています');
    }
  }

  /**
   * 画面遷移時間を記録
   */
  recordScreenTransition(fromScreen: string, toScreen: string, duration: number): void {
    const transitionKey = `${fromScreen}_to_${toScreen}`;
    this.metrics.screenTransitions.set(transitionKey, duration);
    
    this.recordEvent({
      type: 'screen_transition',
      name: transitionKey,
      timestamp: Date.now(),
      value: duration,
    });

    console.log(`🔄 画面遷移 ${transitionKey}: ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`⚠️ 画面遷移時間が目標の1秒を超過: ${transitionKey}`);
    }
  }

  /**
   * メモリ使用量をチェック
   */
  checkMemoryUsage(location: string): void {
    // React Nativeではメモリ使用量の直接取得は制限されているため、
    // 代替として一般的な指標を使用
    const timestamp = Date.now();
    
    // JSヒープサイズ（可能な場合）
    let memoryInfo: any = {};
    if (global.performance && (global.performance as any).memory) {
      memoryInfo = (global.performance as any).memory;
    }

    this.metrics.memoryUsage.set(location, timestamp);
    
    this.recordEvent({
      type: 'memory_check',
      name: location,
      timestamp,
      value: memoryInfo.usedJSHeapSize || 0,
    });

    console.log(`🧠 メモリチェック ${location}:`, memoryInfo);
  }

  /**
   * コンポーネントレンダリング時間を記録
   */
  recordRenderTime(componentName: string, renderTime: number): void {
    this.metrics.renderTimes.set(componentName, renderTime);
    
    this.recordEvent({
      type: 'render_time',
      name: componentName,
      timestamp: Date.now(),
      value: renderTime,
    });

    console.log(`🎨 レンダリング時間 ${componentName}: ${renderTime}ms`);
  }

  /**
   * イベントを記録
   */
  private recordEvent(event: PerformanceEvent): void {
    this.events.push(event);
    
    // 最新1000件のみ保持（メモリ使用量制限）
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * パフォーマンスレポートを生成
   */
  generateReport(): {
    summary: any;
    metrics: PerformanceMetrics;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // 起動時間の評価
    if (this.metrics.appStartTime && this.metrics.appStartTime > 3000) {
      recommendations.push('アプリ起動時間が3秒を超えています。初期化処理の最適化を検討してください。');
    }

    // 画面遷移の評価
    let slowTransitions = 0;
    this.metrics.screenTransitions.forEach((duration, transition) => {
      if (duration > 1000) {
        slowTransitions++;
        recommendations.push(`画面遷移「${transition}」が1秒を超えています。`);
      }
    });

    // パフォーマンス総合評価
    const summary = {
      appStartTime: this.metrics.appStartTime,
      totalScreenTransitions: this.metrics.screenTransitions.size,
      slowTransitions,
      memoryChecks: this.metrics.memoryUsage.size,
      totalEvents: this.events.length,
    };

    return {
      summary,
      metrics: this.metrics,
      recommendations,
    };
  }

  /**
   * パフォーマンスデータをクリア
   */
  clearData(): void {
    this.metrics = {
      screenTransitions: new Map(),
      memoryUsage: new Map(),
      renderTimes: new Map(),
    };
    this.events = [];
    console.log('📊 Performance Monitor データクリア完了');
  }

  /**
   * デバッグ用：全イベントを出力
   */
  debugLog(): void {
    console.log('📊 Performance Monitor Debug Log');
    console.log('Summary:', this.generateReport().summary);
    console.log('Recent Events:', this.events.slice(-10));
  }
}

/**
 * 高次コンポーネント用のパフォーマンス計測フック
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    recordScreenTransition: monitor.recordScreenTransition.bind(monitor),
    checkMemoryUsage: monitor.checkMemoryUsage.bind(monitor),
    recordRenderTime: monitor.recordRenderTime.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor),
  };
}

/**
 * コンポーネントレンダリング時間計測用HOC
 */
export function withPerformanceMonitoring<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  return function PerformanceWrappedComponent(props: T) {
    const monitor = PerformanceMonitor.getInstance();
    const startTime = React.useRef<number | undefined>(undefined);
    
    React.useEffect(() => {
      startTime.current = Date.now();
    }, []);
    
    React.useEffect(() => {
      if (startTime.current) {
        const renderTime = Date.now() - startTime.current;
        monitor.recordRenderTime(componentName, renderTime);
      }
    }, [monitor, componentName]);
    
    return React.createElement(Component, props);
  };
}

// シングルトンインスタンスをエクスポート
export const performanceMonitor = PerformanceMonitor.getInstance();