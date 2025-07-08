/**
 * メモリ使用量最適化フック
 * 画像、大きなリスト、重いコンポーネントの最適化を行う
 */

import React from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface MemoryOptimizationOptions {
  maxListItems?: number;
  imageCompressionQuality?: number;
  enableVirtualization?: boolean;
  cleanupInterval?: number;
}

export function useMemoryOptimization(options: MemoryOptimizationOptions = {}) {
  const {
    maxListItems = 100,
    imageCompressionQuality = 0.8,
    enableVirtualization = true,
    cleanupInterval = 30000, // 30秒
  } = options;

  // メモリクリーンアップの実行
  const performCleanup = React.useCallback(() => {
    // ガベージコレクションのヒント（実際の効果は限定的）
    if (global.gc) {
      global.gc();
    }
    
    // パフォーマンス監視データのクリーンアップ
    performanceMonitor.clearData();
    
    console.log('🧹 メモリクリーンアップ実行');
  }, []);

  // 定期的なクリーンアップ
  React.useEffect(() => {
    const interval = setInterval(performCleanup, cleanupInterval);
    return () => clearInterval(interval);
  }, [performCleanup, cleanupInterval]);

  // 大きなリストの最適化
  const optimizeList = React.useCallback(<T>(items: T[]): T[] => {
    if (!enableVirtualization || items.length <= maxListItems) {
      return items;
    }
    
    console.log(`📋 リスト最適化: ${items.length}件 → ${maxListItems}件`);
    return items.slice(0, maxListItems);
  }, [maxListItems, enableVirtualization]);

  // メモ化されたコンポーネント作成
  const createMemoizedComponent = React.useCallback(<T extends object>(
    Component: React.ComponentType<T>,
    areEqual?: (prevProps: T, nextProps: T) => boolean
  ) => {
    return React.memo(Component, areEqual);
  }, []);

  // 重い計算のメモ化
  const useMemoizedCalculation = React.useCallback(<T>(
    calculation: () => T,
    dependencies: React.DependencyList
  ): T => {
    return React.useMemo(calculation, dependencies);
  }, []);

  // コールバックのメモ化
  const useMemoizedCallback = React.useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    dependencies: React.DependencyList
  ): T => {
    return React.useCallback(callback, dependencies);
  }, []);

  return {
    performCleanup,
    optimizeList,
    createMemoizedComponent,
    useMemoizedCalculation,
    useMemoizedCallback,
    maxListItems,
    imageCompressionQuality,
    enableVirtualization,
  };
}

/**
 * 大きなリスト用の仮想化フック
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollOffset, setScrollOffset] = React.useState(0);

  const visibleItems = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
    );

    return {
      items: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollOffset, overscan]);

  return {
    visibleItems,
    setScrollOffset,
    totalHeight: items.length * itemHeight,
  };
}

/**
 * 画像最適化フック
 */
export function useImageOptimization() {
  const optimizeImageSize = React.useCallback((
    originalWidth: number,
    originalHeight: number,
    maxWidth: number = 800,
    maxHeight: number = 600
  ) => {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    
    if (ratio >= 1) {
      return { width: originalWidth, height: originalHeight };
    }

    return {
      width: Math.floor(originalWidth * ratio),
      height: Math.floor(originalHeight * ratio),
    };
  }, []);

  const calculateImageMemoryUsage = React.useCallback((
    width: number,
    height: number,
    bitsPerPixel: number = 32
  ) => {
    return (width * height * bitsPerPixel) / 8; // バイト単位
  }, []);

  return {
    optimizeImageSize,
    calculateImageMemoryUsage,
  };
}

/**
 * コンポーネントアンマウント時のクリーンアップフック
 */
export function useCleanupOnUnmount(cleanup: () => void) {
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);
}