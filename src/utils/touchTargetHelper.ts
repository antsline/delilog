/**
 * タッチターゲット最適化ヘルパー
 * WCAG AAA基準の44x44pt最小サイズに準拠
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// WCAG AAA準拠の最小タッチターゲットサイズ
export const MIN_TOUCH_TARGET_SIZE = 44;

// 推奨タッチターゲットサイズ
export const RECOMMENDED_TOUCH_TARGET_SIZE = 48;

/**
 * タッチターゲットのサイズを検証
 */
export function validateTouchTargetSize(
  width: number,
  height: number
): {
  isValid: boolean;
  isRecommended: boolean;
  suggestions: string[];
} {
  const isValid = width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
  const isRecommended = width >= RECOMMENDED_TOUCH_TARGET_SIZE && height >= RECOMMENDED_TOUCH_TARGET_SIZE;
  
  const suggestions: string[] = [];
  
  if (!isValid) {
    if (width < MIN_TOUCH_TARGET_SIZE) {
      suggestions.push(`幅を${MIN_TOUCH_TARGET_SIZE}pt以上にしてください（現在: ${width}pt）`);
    }
    if (height < MIN_TOUCH_TARGET_SIZE) {
      suggestions.push(`高さを${MIN_TOUCH_TARGET_SIZE}pt以上にしてください（現在: ${height}pt）`);
    }
  } else if (!isRecommended) {
    suggestions.push('より良いユーザビリティのため、48pt以上のサイズを推奨します');
  }
  
  return { isValid, isRecommended, suggestions };
}

/**
 * 安全なタッチターゲットスタイルを生成
 */
export function createSafeTouchTarget(
  contentSize: { width: number; height: number },
  minSize: number = MIN_TOUCH_TARGET_SIZE
): {
  width: number;
  height: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
} {
  const targetWidth = Math.max(contentSize.width, minSize);
  const targetHeight = Math.max(contentSize.height, minSize);
  
  const paddingHorizontal = Math.max(0, (minSize - contentSize.width) / 2);
  const paddingVertical = Math.max(0, (minSize - contentSize.height) / 2);
  
  return {
    width: targetWidth,
    height: targetHeight,
    ...(paddingHorizontal > 0 && { paddingHorizontal }),
    ...(paddingVertical > 0 && { paddingVertical }),
  };
}

/**
 * hitSlopプロパティを生成（タッチ領域を拡張）
 */
export function createHitSlop(
  currentSize: { width: number; height: number },
  targetSize: number = MIN_TOUCH_TARGET_SIZE
): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const extraWidth = Math.max(0, targetSize - currentSize.width);
  const extraHeight = Math.max(0, targetSize - currentSize.height);
  
  return {
    top: Math.floor(extraHeight / 2),
    bottom: Math.ceil(extraHeight / 2),
    left: Math.floor(extraWidth / 2),
    right: Math.ceil(extraWidth / 2),
  };
}

/**
 * アイコンボタン用の安全なスタイルを生成
 */
export function createIconButtonStyle(
  iconSize: number,
  targetSize: number = MIN_TOUCH_TARGET_SIZE
): {
  width: number;
  height: number;
  justifyContent: 'center';
  alignItems: 'center';
  minWidth: number;
  minHeight: number;
} {
  return {
    width: Math.max(iconSize, targetSize),
    height: Math.max(iconSize, targetSize),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: targetSize,
    minHeight: targetSize,
  };
}

/**
 * テキストボタン用の安全なスタイルを生成
 */
export function createTextButtonStyle(
  textSize: { width: number; height: number },
  targetSize: number = MIN_TOUCH_TARGET_SIZE
): {
  paddingHorizontal: number;
  paddingVertical: number;
  minWidth: number;
  minHeight: number;
} {
  const horizontalPadding = Math.max(8, (targetSize - textSize.width) / 2);
  const verticalPadding = Math.max(4, (targetSize - textSize.height) / 2);
  
  return {
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
    minWidth: targetSize,
    minHeight: targetSize,
  };
}

/**
 * フォーム要素用の安全なスタイルを生成
 */
export function createFormElementStyle(
  minHeight: number = 48 // フォーム要素は少し大きめ
): {
  minHeight: number;
  paddingVertical: number;
  paddingHorizontal: number;
} {
  return {
    minHeight,
    paddingVertical: Math.max(12, (minHeight - 24) / 2), // テキストサイズを考慮
    paddingHorizontal: 16,
  };
}

/**
 * タッチターゲット間の適切な間隔を計算
 */
export function calculateSpacing(
  targetCount: number,
  containerWidth: number,
  targetSize: number = MIN_TOUCH_TARGET_SIZE,
  minSpacing: number = 8
): {
  spacing: number;
  isOptimal: boolean;
  suggestion?: string;
} {
  const totalTargetWidth = targetCount * targetSize;
  const availableSpaceForSpacing = containerWidth - totalTargetWidth;
  const spacing = Math.max(minSpacing, availableSpaceForSpacing / (targetCount - 1));
  
  // 最適な間隔は12pt以上
  const isOptimal = spacing >= 12;
  
  const suggestion = !isOptimal 
    ? 'タッチターゲット間の間隔が狭いため、誤操作の可能性があります'
    : undefined;
  
  return { spacing, isOptimal, suggestion };
}

/**
 * デバイスサイズに応じたタッチターゲットサイズを取得
 */
export function getDeviceOptimizedTargetSize(): {
  minSize: number;
  recommendedSize: number;
  isLargeDevice: boolean;
} {
  const isLargeDevice = screenWidth >= 768; // タブレット判定
  
  return {
    minSize: MIN_TOUCH_TARGET_SIZE,
    recommendedSize: isLargeDevice ? 56 : RECOMMENDED_TOUCH_TARGET_SIZE,
    isLargeDevice,
  };
}

/**
 * タッチターゲット設定のヘルパークラス
 */
export class TouchTargetHelper {
  static validateAndImprove(
    element: {
      width: number;
      height: number;
      type: 'button' | 'icon' | 'text' | 'form';
    }
  ): {
    originalSize: { width: number; height: number };
    improvedSize: { width: number; height: number };
    hitSlop?: { top: number; bottom: number; left: number; right: number };
    padding?: { horizontal: number; vertical: number };
    isValid: boolean;
    improvements: string[];
  } {
    const { width, height, type } = element;
    const validation = validateTouchTargetSize(width, height);
    
    let improvedSize = { width, height };
    let hitSlop;
    let padding;
    const improvements: string[] = [];
    
    if (!validation.isValid) {
      switch (type) {
        case 'icon':
          improvedSize = {
            width: Math.max(width, MIN_TOUCH_TARGET_SIZE),
            height: Math.max(height, MIN_TOUCH_TARGET_SIZE),
          };
          improvements.push('アイコンのタッチ領域を拡張しました');
          break;
          
        case 'button':
        case 'text':
          const safeTarget = createSafeTouchTarget({ width, height });
          improvedSize = { width: safeTarget.width, height: safeTarget.height };
          if (safeTarget.paddingHorizontal || safeTarget.paddingVertical) {
            padding = {
              horizontal: safeTarget.paddingHorizontal || 0,
              vertical: safeTarget.paddingVertical || 0,
            };
            improvements.push('パディングでタッチ領域を拡張しました');
          }
          break;
          
        case 'form':
          const formStyle = createFormElementStyle();
          improvedSize = {
            width: Math.max(width, MIN_TOUCH_TARGET_SIZE),
            height: formStyle.minHeight,
          };
          improvements.push('フォーム要素の高さを調整しました');
          break;
      }
      
      // hitSlopでの調整も提案
      if (improvedSize.width === width && improvedSize.height === height) {
        hitSlop = createHitSlop({ width, height });
        improvements.push('hitSlopでタッチ領域を拡張しました');
      }
    }
    
    return {
      originalSize: { width, height },
      improvedSize,
      hitSlop,
      padding,
      isValid: validation.isValid,
      improvements,
    };
  }
}