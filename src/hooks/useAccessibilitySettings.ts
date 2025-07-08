/**
 * アクセシビリティ設定管理フック
 * フォントサイズ、高コントラストモード、スクリーンリーダー対応
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accessibilityManager } from '@/utils/accessibility';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
  highContrastMode: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  highContrastMode: false,
  reduceMotion: false,
  screenReaderOptimized: false,
};

const STORAGE_KEY = 'accessibility_settings';

export function useAccessibilitySettings() {
  const [settings, setSettings] = React.useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(true);

  // 設定の読み込み
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        
        // アクセシビリティマネージャーに設定を適用
        accessibilityManager.setFontSize(parsed.fontSize || DEFAULT_SETTINGS.fontSize);
        accessibilityManager.setHighContrastEnabled(parsed.highContrastMode || false);
      }
    } catch (error) {
      console.error('❌ アクセシビリティ設定読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // アクセシビリティマネージャーに設定を適用
      accessibilityManager.setFontSize(newSettings.fontSize);
      accessibilityManager.setHighContrastEnabled(newSettings.highContrastMode);
      
      console.log('💾 アクセシビリティ設定保存完了:', newSettings);
    } catch (error) {
      console.error('❌ アクセシビリティ設定保存エラー:', error);
    }
  };

  // フォントサイズの変更
  const setFontSize = React.useCallback((fontSize: AccessibilitySettings['fontSize']) => {
    const newSettings = { ...settings, fontSize };
    saveSettings(newSettings);
  }, [settings]);

  // 高コントラストモードの切り替え
  const setHighContrastMode = React.useCallback((enabled: boolean) => {
    const newSettings = { ...settings, highContrastMode: enabled };
    saveSettings(newSettings);
  }, [settings]);

  // アニメーション削減の切り替え
  const setReduceMotion = React.useCallback((enabled: boolean) => {
    const newSettings = { ...settings, reduceMotion: enabled };
    saveSettings(newSettings);
  }, [settings]);

  // スクリーンリーダー最適化の切り替え
  const setScreenReaderOptimized = React.useCallback((enabled: boolean) => {
    const newSettings = { ...settings, screenReaderOptimized: enabled };
    saveSettings(newSettings);
  }, [settings]);

  // フォントサイズのスケール値を取得
  const getFontScale = React.useCallback(() => {
    const scaleMap = {
      small: 0.85,
      medium: 1.0,
      large: 1.15,
      extraLarge: 1.3,
    };
    return scaleMap[settings.fontSize];
  }, [settings.fontSize]);

  // スケールされたフォントサイズを取得
  const getScaledFontSize = React.useCallback((baseSize: number) => {
    return Math.round(baseSize * getFontScale());
  }, [getFontScale]);

  // アクセシビリティに配慮したスタイルを取得
  const getAccessibleStyles = React.useCallback(() => {
    return {
      fontSize: getFontScale(),
      highContrast: settings.highContrastMode,
      reduceMotion: settings.reduceMotion,
      screenReaderOptimized: settings.screenReaderOptimized,
    };
  }, [settings, getFontScale]);

  return {
    settings,
    loading,
    setFontSize,
    setHighContrastMode,
    setReduceMotion,
    setScreenReaderOptimized,
    getFontScale,
    getScaledFontSize,
    getAccessibleStyles,
  };
}

/**
 * アクセシビリティ対応スタイル生成フック
 */
export function useAccessibleStyles(baseStyles: any) {
  const { getScaledFontSize, settings } = useAccessibilitySettings();

  const accessibleStyles = React.useMemo(() => {
    if (!baseStyles) return {};

    const scaledStyles = { ...baseStyles };

    // フォントサイズをスケール
    Object.keys(scaledStyles).forEach(key => {
      const style = scaledStyles[key];
      if (style && typeof style === 'object' && style.fontSize) {
        scaledStyles[key] = {
          ...style,
          fontSize: getScaledFontSize(style.fontSize),
        };
      }
    });

    // 高コントラストモード対応
    if (settings.highContrastMode) {
      Object.keys(scaledStyles).forEach(key => {
        const style = scaledStyles[key];
        if (style && typeof style === 'object') {
          // 色のコントラストを強化
          if (style.color) {
            scaledStyles[key] = {
              ...style,
              color: accessibilityManager.getContrastColor(style.color),
            };
          }
          if (style.backgroundColor) {
            scaledStyles[key] = {
              ...style,
              backgroundColor: accessibilityManager.getContrastColor(style.backgroundColor),
            };
          }
        }
      });
    }

    return scaledStyles;
  }, [baseStyles, getScaledFontSize, settings]);

  return accessibleStyles;
}

/**
 * スクリーンリーダー用のテキスト生成フック
 */
export function useScreenReaderText() {
  const { settings } = useAccessibilitySettings();

  const generateText = React.useCallback((
    mainText: string,
    additionalInfo?: string[],
    state?: string
  ) => {
    if (!settings.screenReaderOptimized) {
      return mainText;
    }

    let text = mainText;
    
    if (additionalInfo && additionalInfo.length > 0) {
      text += `。追加情報: ${additionalInfo.join('、')}`;
    }
    
    if (state) {
      text += `。状態: ${state}`;
    }
    
    return text;
  }, [settings.screenReaderOptimized]);

  return { generateText };
}