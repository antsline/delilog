/**
 * アプリ起動時間最適化フック
 * 3秒以内の起動を目指す
 */

import React from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

export function useAppStartupOptimization() {
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [startupPhase, setStartupPhase] = React.useState<
    'initializing' | 'loading_auth' | 'loading_data' | 'ready'
  >('initializing');

  React.useEffect(() => {
    const startTime = Date.now();
    
    // 起動完了時の処理
    const markAppReady = () => {
      const startupTime = Date.now() - startTime;
      performanceMonitor.recordAppStartComplete();
      
      console.log(`🚀 アプリ起動完了: ${startupTime}ms`);
      
      if (startupTime > 3000) {
        console.warn('⚠️ 起動時間が目標の3秒を超過しています');
      }
      
      setIsAppReady(true);
      setStartupPhase('ready');
    };

    // 段階的ロード処理
    const loadApp = async () => {
      try {
        // フェーズ1: 認証関連の初期化
        setStartupPhase('loading_auth');
        await new Promise(resolve => setTimeout(resolve, 100)); // 認証処理の模擬
        
        // フェーズ2: 重要データの先行ロード
        setStartupPhase('loading_data');
        await new Promise(resolve => setTimeout(resolve, 100)); // データロードの模擬
        
        // フェーズ3: アプリ準備完了
        markAppReady();
      } catch (error) {
        console.error('アプリ起動エラー:', error);
        // エラー時も一定時間後にアプリを利用可能にする
        setTimeout(markAppReady, 1000);
      }
    };

    loadApp();
  }, []);

  // 起動状況の監視
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAppReady) {
        console.warn('⚠️ アプリ起動に5秒以上かかっています');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isAppReady]);

  return {
    isAppReady,
    startupPhase,
    isSlowStartup: !isAppReady && Date.now() > 3000, // 3秒経過後もfalseなら遅い
  };
}

/**
 * 遅延ロード用フック
 * 重要でないコンポーネントの遅延ロード
 */
export function useLazyComponentLoad(
  delay: number = 200
): { shouldRender: boolean } {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return { shouldRender };
}

/**
 * 画像遅延ロード用フック
 */
export function useLazyImageLoad(
  imageUri: string,
  delay: number = 500
): { 
  shouldLoadImage: boolean; 
  imageSource: { uri: string } | undefined;
} {
  const [shouldLoadImage, setShouldLoadImage] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadImage(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const imageSource = React.useMemo(() => {
    return shouldLoadImage ? { uri: imageUri } : undefined;
  }, [shouldLoadImage, imageUri]);

  return { shouldLoadImage, imageSource };
}