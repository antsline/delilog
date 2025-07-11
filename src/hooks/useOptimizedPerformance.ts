/**
 * パフォーマンス最適化フック
 * メモ化、デバウンス、レンダリング最適化を提供
 */

import React from 'react';

/**
 * 高コストな計算のメモ化フック
 */
export function useExpensiveCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return React.useMemo(calculation, dependencies);
}

/**
 * デバウンス処理フック
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * コールバック最適化フック
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return React.useCallback(callback, dependencies);
}

/**
 * リスト項目最適化のためのメモ化コンポーネント作成
 */
export function createMemoizedListItem<T>(
  component: React.ComponentType<T>
): React.ComponentType<T> {
  return React.memo(component, (prevProps, nextProps) => {
    // 浅い比較で十分な場合
    return Object.keys(prevProps as object).every(
      key => (prevProps as any)[key] === (nextProps as any)[key]
    );
  });
}

/**
 * 大量データ処理用のチャンク処理フック
 */
export function useChunkedProcessing<T, R>(
  data: T[],
  processor: (item: T) => R,
  chunkSize: number = 10
): R[] {
  const [processedData, setProcessedData] = React.useState<R[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (data.length === 0) {
      setProcessedData([]);
      return;
    }

    setIsProcessing(true);
    const chunks: T[][] = [];
    
    // データをチャンクに分割
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    let processed: R[] = [];
    let chunkIndex = 0;

    const processNextChunk = () => {
      if (chunkIndex < chunks.length) {
        const chunkResults = chunks[chunkIndex].map(processor);
        processed = [...processed, ...chunkResults];
        chunkIndex++;
        
        // 次のチャンクを非同期で処理
        setTimeout(processNextChunk, 0);
      } else {
        setProcessedData(processed);
        setIsProcessing(false);
      }
    };

    processNextChunk();
  }, [data, processor, chunkSize]);

  return processedData;
}

/**
 * レンダリング回数制限フック（高頻度更新の制限）
 */
export function useThrottledRender<T>(value: T, interval: number = 100): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdated = React.useRef<number>(0);

  React.useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - (now - lastUpdated.current));

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * 遅延ローディングフック
 */
export function useLazyLoading<T>(
  loadFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  delay: number = 0
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      if (cancelled) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await loadFunction();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}

/**
 * 仮想スクロール用のビューポート計算フック
 */
export function useVirtualScrolling(
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  scrollOffset: number
): { startIndex: number; endIndex: number; visibleItems: number } {
  return React.useMemo(() => {
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - 2); // バッファ
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + 4); // バッファ

    return {
      startIndex,
      endIndex,
      visibleItems,
    };
  }, [itemHeight, containerHeight, totalItems, scrollOffset]);
}

/**
 * メモリリーク防止のためのクリーンアップフック
 */
export function useCleanupEffect(
  effect: () => (() => void) | void,
  dependencies: React.DependencyList
): void {
  React.useEffect(() => {
    const cleanup = effect();
    return cleanup;
  }, dependencies);
}

/**
 * パフォーマンス計測フック
 */
export function usePerformanceMeasure(name: string): {
  startMeasure: () => void;
  endMeasure: () => number;
  getAverageTime: () => number;
} {
  const startTime = React.useRef<number>(0);
  const measurements = React.useRef<number[]>([]);
  
  const startMeasure = React.useCallback(() => {
    startTime.current = performance.now();
    console.log(`⏱️ [${name}] 計測開始`);
  }, [name]);
  
  const endMeasure = React.useCallback(() => {
    const duration = performance.now() - startTime.current;
    measurements.current.push(duration);
    
    // 最新100件のみ保持
    if (measurements.current.length > 100) {
      measurements.current = measurements.current.slice(-100);
    }
    
    console.log(`⏱️ [${name}] 完了: ${duration.toFixed(2)}ms`);
    return duration;
  }, [name]);
  
  const getAverageTime = React.useCallback(() => {
    if (measurements.current.length === 0) return 0;
    const sum = measurements.current.reduce((acc, time) => acc + time, 0);
    return sum / measurements.current.length;
  }, []);
  
  return { startMeasure, endMeasure, getAverageTime };
}

/**
 * 最適化効果の検証フック
 */
export function useOptimizationMetrics(componentName: string): {
  recordRender: () => void;
  recordCallback: (callbackName: string) => void;
  getMetrics: () => {
    renderCount: number;
    averageRenderTime: number;
    callbackStats: Record<string, { count: number; averageTime: number }>;
  };
} {
  const renderCount = React.useRef(0);
  const renderTimes = React.useRef<number[]>([]);
  const callbackStats = React.useRef<Record<string, { times: number[]; count: number }>>({});
  const lastRenderTime = React.useRef(performance.now());

  const recordRender = React.useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    renderCount.current++;
    renderTimes.current.push(renderTime);
    lastRenderTime.current = now;

    // 最新50件のみ保持
    if (renderTimes.current.length > 50) {
      renderTimes.current = renderTimes.current.slice(-50);
    }

    console.log(`🎨 [${componentName}] レンダリング #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
  }, [componentName]);

  const recordCallback = React.useCallback((callbackName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!callbackStats.current[callbackName]) {
        callbackStats.current[callbackName] = { times: [], count: 0 };
      }
      
      callbackStats.current[callbackName].times.push(duration);
      callbackStats.current[callbackName].count++;
      
      // 最新20件のみ保持
      if (callbackStats.current[callbackName].times.length > 20) {
        callbackStats.current[callbackName].times = callbackStats.current[callbackName].times.slice(-20);
      }
    };
  }, []);

  const getMetrics = React.useCallback(() => {
    const averageRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((acc, time) => acc + time, 0) / renderTimes.current.length
      : 0;

    const processedCallbackStats: Record<string, { count: number; averageTime: number }> = {};
    
    Object.entries(callbackStats.current).forEach(([name, stats]) => {
      const averageTime = stats.times.length > 0
        ? stats.times.reduce((acc, time) => acc + time, 0) / stats.times.length
        : 0;
      
      processedCallbackStats[name] = {
        count: stats.count,
        averageTime,
      };
    });

    return {
      renderCount: renderCount.current,
      averageRenderTime,
      callbackStats: processedCallbackStats,
    };
  }, []);

  return { recordRender, recordCallback, getMetrics };
}