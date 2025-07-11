/**
 * パフォーマンス最適化の効果測定レポーター
 */

import { performanceMonitor } from './performanceMonitor';

export interface PerformanceReport {
  summary: {
    appStartTime: number | undefined;
    totalScreenTransitions: number;
    slowTransitions: number;
    memoryChecks: number;
    totalEvents: number;
  };
  optimizationMetrics: {
    componentsOptimized: string[];
    renderOptimizations: number;
    callbackOptimizations: number;
  };
  recommendations: string[];
  benchmarks: {
    appStartTarget: number;
    screenTransitionTarget: number;
    renderTimeTarget: number;
  };
}

export class PerformanceReporter {
  private static readonly TARGETS = {
    APP_START: 3000, // 3秒
    SCREEN_TRANSITION: 1000, // 1秒
    RENDER_TIME: 16, // 60FPS = 16.67ms
  };

  private static optimizedComponents: Set<string> = new Set();
  private static renderOptimizations = 0;
  private static callbackOptimizations = 0;

  /**
   * 最適化の記録
   */
  static recordOptimization(type: 'component' | 'render' | 'callback', name?: string): void {
    switch (type) {
      case 'component':
        if (name) this.optimizedComponents.add(name);
        break;
      case 'render':
        this.renderOptimizations++;
        break;
      case 'callback':
        this.callbackOptimizations++;
        break;
    }
  }

  /**
   * 包括的なパフォーマンスレポートを生成
   */
  static generateComprehensiveReport(): PerformanceReport {
    const monitorReport = performanceMonitor.generateReport();
    
    const recommendations: string[] = [];
    
    // 起動時間の評価
    if (monitorReport.summary.appStartTime && monitorReport.summary.appStartTime > this.TARGETS.APP_START) {
      recommendations.push(
        `アプリ起動時間が目標の${this.TARGETS.APP_START}msを${monitorReport.summary.appStartTime - this.TARGETS.APP_START}ms超過しています。`
      );
      recommendations.push('- useAppStartupOptimizationの活用を検討してください');
      recommendations.push('- 重要でないコンポーネントの遅延ローディングを実装してください');
    } else if (monitorReport.summary.appStartTime) {
      recommendations.push(`✅ アプリ起動時間が目標内です（${monitorReport.summary.appStartTime}ms）`);
    }

    // 画面遷移の評価
    if (monitorReport.summary.slowTransitions > 0) {
      recommendations.push(`${monitorReport.summary.slowTransitions}個の遅い画面遷移があります。`);
      recommendations.push('- useOptimizedCallbackの適用を検討してください');
      recommendations.push('- 画面間のデータ受け渡しを最適化してください');
    } else if (monitorReport.summary.totalScreenTransitions > 0) {
      recommendations.push('✅ すべての画面遷移が目標時間内です');
    }

    // 最適化効果の評価
    if (this.optimizedComponents.size > 0) {
      recommendations.push(`✅ ${this.optimizedComponents.size}個のコンポーネントが最適化されています`);
    } else {
      recommendations.push('コンポーネントの最適化を開始してください');
      recommendations.push('- React.memoの適用');
      recommendations.push('- useOptimizedCallbackの使用');
      recommendations.push('- useExpensiveCalculationの適用');
    }

    return {
      summary: monitorReport.summary,
      optimizationMetrics: {
        componentsOptimized: Array.from(this.optimizedComponents),
        renderOptimizations: this.renderOptimizations,
        callbackOptimizations: this.callbackOptimizations,
      },
      recommendations,
      benchmarks: {
        appStartTarget: this.TARGETS.APP_START,
        screenTransitionTarget: this.TARGETS.SCREEN_TRANSITION,
        renderTimeTarget: this.TARGETS.RENDER_TIME,
      },
    };
  }

  /**
   * パフォーマンス改善提案を生成
   */
  static generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    suggestions.push('🚀 パフォーマンス最適化提案:');
    suggestions.push('');
    
    // コンポーネント最適化
    suggestions.push('📱 コンポーネント最適化:');
    suggestions.push('- 頻繁に更新されるコンポーネントにReact.memoを適用');
    suggestions.push('- 重いリストアイテムにcreateMemoizedListItemを使用');
    suggestions.push('- 条件付きレンダリングでuseLazyComponentLoadを活用');
    suggestions.push('');
    
    // データ処理最適化
    suggestions.push('⚡ データ処理最適化:');
    suggestions.push('- 大量データにuseChunkedProcessingを適用');
    suggestions.push('- 高コストな計算にuseExpensiveCalculationを使用');
    suggestions.push('- 頻繁な更新にuseThrottledRenderを適用');
    suggestions.push('');
    
    // メモリ最適化
    suggestions.push('🧠 メモリ最適化:');
    suggestions.push('- useCleanupEffectでメモリリーク防止');
    suggestions.push('- 不要なイベントリスナーの削除');
    suggestions.push('- 大きなオブジェクトの適切な解放');
    suggestions.push('');
    
    // 起動最適化
    suggestions.push('🏃 起動最適化:');
    suggestions.push('- useAppStartupOptimizationで段階的ローディング');
    suggestions.push('- 重要でない画像のuseLazyImageLoad');
    suggestions.push('- バンドルサイズの最適化');
    
    return suggestions;
  }

  /**
   * パフォーマンスダッシュボード表示用データ
   */
  static getDashboardData(): {
    metrics: Record<string, number>;
    status: Record<string, 'good' | 'warning' | 'error'>;
    trends: Record<string, number[]>;
  } {
    const report = this.generateComprehensiveReport();
    
    const metrics = {
      appStartTime: report.summary.appStartTime || 0,
      screenTransitions: report.summary.totalScreenTransitions,
      slowTransitions: report.summary.slowTransitions,
      optimizedComponents: report.optimizationMetrics.componentsOptimized.length,
      memoryChecks: report.summary.memoryChecks,
    };

    const status: Record<string, 'good' | 'warning' | 'error'> = {
      appStart: this.getStatus(metrics.appStartTime, this.TARGETS.APP_START),
      transitions: metrics.slowTransitions === 0 ? 'good' : 'warning',
      optimization: metrics.optimizedComponents > 0 ? 'good' : 'warning',
      memory: 'good', // 基本的に問題なしとして扱う
    };

    // トレンドデータは実装時に追加
    const trends: Record<string, number[]> = {
      appStartTime: [],
      renderTimes: [],
      memoryUsage: [],
    };

    return { metrics, status, trends };
  }

  private static getStatus(value: number, target: number, inverse = false): 'good' | 'warning' | 'error' {
    if (value === 0) return 'warning'; // データなし
    
    const ratio = inverse ? target / value : value / target;
    
    if (ratio <= 0.8) return 'good';
    if (ratio <= 1.2) return 'warning';
    return 'error';
  }

  /**
   * デバッグ用：最適化状況を出力
   */
  static debugOptimizationStatus(): void {
    console.log('🔍 パフォーマンス最適化状況:');
    console.log('最適化済みコンポーネント:', Array.from(this.optimizedComponents));
    console.log('レンダリング最適化数:', this.renderOptimizations);
    console.log('コールバック最適化数:', this.callbackOptimizations);
    
    const report = this.generateComprehensiveReport();
    console.log('推奨事項:', report.recommendations);
  }
}

// 自動記録のためのヘルパー
export const recordComponentOptimization = (componentName: string) => {
  PerformanceReporter.recordOptimization('component', componentName);
  console.log(`✅ ${componentName} が最適化されました`);
};

export const recordRenderOptimization = () => {
  PerformanceReporter.recordOptimization('render');
};

export const recordCallbackOptimization = () => {
  PerformanceReporter.recordOptimization('callback');
};