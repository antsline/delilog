/**
 * アクセシブルテキストコンポーネント
 * 動的テキストサイズ、高コントラスト、スクリーンリーダー対応
 */

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { accessibilityManager } from '@/utils/accessibility';
import { colors } from '@/constants/colors';

interface AccessibleTextProps extends TextProps {
  /** テキストの種類 */
  variant?: 
    | 'heading1'      // 24pt
    | 'heading2'      // 20pt  
    | 'heading3'      // 18pt
    | 'body'          // 16pt
    | 'caption'       // 14pt
    | 'small'         // 12pt
    | 'button'        // 16pt (ボタン用)
    | 'label';        // 14pt (ラベル用)
  
  /** セマンティックレベル */
  semantic?: 'primary' | 'secondary' | 'tertiary' | 'disabled';
  
  /** 高コントラストモード強制適用 */
  forceHighContrast?: boolean;
  
  /** 太字表示 */
  weight?: 'normal' | 'medium' | 'bold';
  
  /** テキストの重要度 */
  importance?: 'critical' | 'high' | 'medium' | 'low';
  
  /** 色覚障害対応 */
  colorBlindSupport?: boolean;
  
  /** 追加のアクセシビリティ情報 */
  accessibilityExtra?: {
    hint?: string;
    role?: string;
    state?: {
      disabled?: boolean;
      selected?: boolean;
    };
  };
}

// ベースフォントサイズ定義
const baseFontSizes = {
  heading1: 24,
  heading2: 20,
  heading3: 18,
  body: 16,
  caption: 14,
  small: 12,
  button: 16,
  label: 14,
} as const;

// フォントウェイト定義
const fontWeights = {
  normal: '400',
  medium: '500',
  bold: '700',
} as const;

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  semantic = 'primary',
  forceHighContrast = false,
  weight = 'normal',
  importance = 'medium',
  colorBlindSupport = false,
  accessibilityExtra,
  style,
  ...props
}) => {
  const { settings, getScaledFontSize } = useAccessibilitySettings();
  
  // スケールされたフォントサイズを計算
  const baseFontSize = baseFontSizes[variant];
  const scaledFontSize = getScaledFontSize(baseFontSize);
  
  // セマンティックカラーを取得
  const getSemanticColor = React.useCallback(() => {
    const shouldUseHighContrast = forceHighContrast || settings.highContrastMode;
    
    if (shouldUseHighContrast) {
      switch (semantic) {
        case 'primary':
          return accessibilityManager.getContrastColor(colors.charcoal);
        case 'secondary':
          return accessibilityManager.getContrastColor(colors.darkGray);
        case 'tertiary':
          return accessibilityManager.getContrastColor('#999999');
        case 'disabled':
          return accessibilityManager.getContrastColor('#CCCCCC');
        default:
          return accessibilityManager.getContrastColor(colors.charcoal);
      }
    }
    
    switch (semantic) {
      case 'primary':
        return colors.charcoal;
      case 'secondary':
        return colors.darkGray;
      case 'tertiary':
        return '#666666';
      case 'disabled':
        return '#999999';
      default:
        return colors.charcoal;
    }
  }, [semantic, forceHighContrast, settings.highContrastMode]);
  
  // 重要度に応じたスタイル調整
  const getImportanceStyle = React.useCallback(() => {
    const baseStyle: any = {};
    
    switch (importance) {
      case 'critical':
        baseStyle.fontWeight = fontWeights.bold;
        baseStyle.textDecorationLine = 'underline';
        break;
      case 'high':
        baseStyle.fontWeight = fontWeights.medium;
        break;
      case 'medium':
        baseStyle.fontWeight = fontWeights[weight];
        break;
      case 'low':
        baseStyle.fontWeight = fontWeights.normal;
        baseStyle.opacity = 0.8;
        break;
    }
    
    return baseStyle;
  }, [importance, weight]);
  
  // 最終的なスタイルを構築
  const computedStyle = React.useMemo(() => {
    return [
      styles.baseText,
      {
        fontSize: scaledFontSize,
        color: getSemanticColor(),
        ...getImportanceStyle(),
      },
      style,
    ];
  }, [scaledFontSize, getSemanticColor, getImportanceStyle, style]);
  
  // アクセシビリティプロパティを構築
  const accessibilityProps = React.useMemo(() => {
    const props: any = {
      accessible: true,
      allowFontScaling: true, // システムのフォントサイズ設定に対応
    };
    
    // スクリーンリーダー最適化
    if (settings.screenReaderOptimized) {
      props.accessibilityLabel = typeof children === 'string' ? children : undefined;
    }
    
    // 追加のアクセシビリティ情報
    if (accessibilityExtra) {
      if (accessibilityExtra.hint) {
        props.accessibilityHint = accessibilityExtra.hint;
      }
      if (accessibilityExtra.role) {
        props.accessibilityRole = accessibilityExtra.role;
      }
      if (accessibilityExtra.state) {
        props.accessibilityState = accessibilityExtra.state;
      }
    }
    
    // 重要度をアクセシビリティに反映
    if (importance === 'critical') {
      props.accessibilityLiveRegion = 'assertive';
    } else if (importance === 'high') {
      props.accessibilityLiveRegion = 'polite';
    }
    
    return props;
  }, [children, settings.screenReaderOptimized, accessibilityExtra, importance]);
  
  return (
    <Text
      style={computedStyle}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </Text>
  );
};

// プリセットコンポーネント
export const Heading1: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="heading1" weight="bold" semantic="primary" {...props} />
);

export const Heading2: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="heading2" weight="medium" semantic="primary" {...props} />
);

export const Heading3: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="heading3" weight="medium" semantic="primary" {...props} />
);

export const BodyText: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="body" semantic="primary" {...props} />
);

export const Caption: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="caption" semantic="secondary" {...props} />
);

export const SmallText: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="small" semantic="tertiary" {...props} />
);

export const ButtonText: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="button" weight="medium" semantic="primary" {...props} />
);

export const Label: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="label" weight="medium" semantic="primary" {...props} />
);

// 特殊用途コンポーネント
export const ErrorText: React.FC<Omit<AccessibleTextProps, 'variant' | 'semantic'>> = (props) => (
  <AccessibleText 
    variant="caption" 
    semantic="primary" 
    importance="high"
    style={{ color: colors.error }}
    accessibilityExtra={{
      role: 'alert',
      hint: 'エラーメッセージです',
    }}
    {...props} 
  />
);

export const SuccessText: React.FC<Omit<AccessibleTextProps, 'variant' | 'semantic'>> = (props) => (
  <AccessibleText 
    variant="caption" 
    semantic="primary"
    style={{ color: colors.success }}
    accessibilityExtra={{
      hint: '成功メッセージです',
    }}
    {...props} 
  />
);

export const WarningText: React.FC<Omit<AccessibleTextProps, 'variant' | 'semantic'>> = (props) => (
  <AccessibleText 
    variant="caption" 
    semantic="primary"
    importance="high"
    style={{ color: colors.orange }}
    accessibilityExtra={{
      role: 'alert',
      hint: '警告メッセージです',
    }}
    {...props} 
  />
);

const styles = StyleSheet.create({
  baseText: {
    fontFamily: 'System', // システムフォントを使用
    includeFontPadding: false, // Android用の調整
    textAlignVertical: 'center', // Android用の調整
  },
});

export default AccessibleText;