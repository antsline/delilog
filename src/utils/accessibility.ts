/**
 * アクセシビリティユーティリティ
 * WCAG 2.1 AA準拠のアクセシビリティ機能を提供
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { colors } from '@/constants/colors';

// アクセシビリティラベルの定数
export const AccessibilityLabels = {
  // ナビゲーション
  HOME_TAB: 'ホーム画面タブ',
  RECORDS_TAB: '記録一覧タブ', 
  SETTINGS_TAB: '設定タブ',
  
  // 点呼記録
  BEFORE_TENKO_BUTTON: '業務前点呼を記録するボタン',
  AFTER_TENKO_BUTTON: '業務後点呼を記録するボタン',
  SAVE_RECORD_BUTTON: '点呼記録を保存するボタン',
  
  // フォーム要素
  VEHICLE_SELECTOR: '車両選択',
  CHECK_METHOD_SELECTOR: '点呼方法選択',
  ALCOHOL_LEVEL_INPUT: 'アルコール濃度入力',
  HEALTH_STATUS_SELECTOR: '健康状態選択',
  NOTES_INPUT: '特記事項入力',
  
  // 操作
  BACK_BUTTON: '前の画面に戻るボタン',
  CLOSE_BUTTON: '閉じるボタン',
  EDIT_BUTTON: '編集ボタン',
  DELETE_BUTTON: '削除ボタン',
  
  // 状態表示
  LOADING: '読み込み中',
  ERROR: 'エラーが発生しました',
  SUCCESS: '完了しました',
} as const;

// アクセシビリティヒントの定数
export const AccessibilityHints = {
  TENKO_BUTTON: '点呼記録画面を開きます',
  SAVE_BUTTON: '入力された内容を保存します',
  VEHICLE_SELECTOR: 'ダブルタップで車両を選択します',
  NAVIGATION: 'ダブルタップで画面を切り替えます',
} as const;

// アクセシビリティロールの定数
export const AccessibilityRoles = {
  BUTTON: 'button' as const,
  TAB: 'tab' as const,
  TEXT: 'text' as const,
  HEADER: 'header' as const,
  LINK: 'link' as const,
  IMAGE: 'image' as const,
  ALERT: 'alert' as const,
  FORM: 'form' as const,
  SEARCH: 'search' as const,
} as const;

/**
 * アクセシビリティ状態管理
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private isScreenReaderEnabled = false;
  private fontSize: 'small' | 'medium' | 'large' | 'extraLarge' = 'medium';
  private highContrastEnabled = false;

  private constructor() {
    this.initializeAccessibility();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private async initializeAccessibility(): Promise<void> {
    try {
      // スクリーンリーダーの状態を確認
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // アクセシビリティサービスの変更を監視
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.isScreenReaderEnabled = enabled;
        console.log('📱 スクリーンリーダー状態変更:', enabled);
      });

      console.log('♿ アクセシビリティマネージャー初期化完了');
    } catch (error) {
      console.error('❌ アクセシビリティ初期化エラー:', error);
    }
  }

  getScreenReaderEnabled(): boolean {
    return this.isScreenReaderEnabled;
  }

  getFontSize(): 'small' | 'medium' | 'large' | 'extraLarge' {
    return this.fontSize;
  }

  setFontSize(size: 'small' | 'medium' | 'large' | 'extraLarge'): void {
    this.fontSize = size;
    console.log('🔤 フォントサイズ変更:', size);
  }

  getHighContrastEnabled(): boolean {
    return this.highContrastEnabled;
  }

  setHighContrastEnabled(enabled: boolean): void {
    this.highContrastEnabled = enabled;
    console.log('🌓 高コントラストモード:', enabled);
  }

  /**
   * フォントサイズに応じたサイズを返す
   */
  getScaledFontSize(baseSize: number): number {
    const scaleFactor = {
      small: 0.85,
      medium: 1.0,
      large: 1.15,
      extraLarge: 1.3,
    };
    
    return Math.round(baseSize * scaleFactor[this.fontSize]);
  }

  /**
   * 高コントラストモード用の色を返す
   */
  getContrastColor(originalColor: string): string {
    if (!this.highContrastEnabled) {
      return originalColor;
    }

    // 高コントラスト用の色マッピング
    const contrastMap: Record<string, string> = {
      [colors.cream]: '#FFFFFF',
      [colors.charcoal]: '#000000',
      [colors.darkGray]: '#000000',
      [colors.orange]: '#FF6600',
      [colors.beige]: '#F0F0F0',
      [colors.error]: '#CC0000',
      [colors.success]: '#006600',
    };

    return contrastMap[originalColor] || originalColor;
  }
}

/**
 * アクセシビリティ対応コンポーネントプロップス生成
 */
export function createAccessibleProps(
  label: string,
  hint?: string,
  role?: string,
  state?: {
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
  }
) {
  const props: any = {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: role,
  };

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (state) {
    if (state.disabled !== undefined) {
      props.accessibilityState = { ...props.accessibilityState, disabled: state.disabled };
    }
    if (state.selected !== undefined) {
      props.accessibilityState = { ...props.accessibilityState, selected: state.selected };
    }
    if (state.expanded !== undefined) {
      props.accessibilityState = { ...props.accessibilityState, expanded: state.expanded };
    }
  }

  return props;
}

/**
 * コントラスト比を計算
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // 簡略化されたコントラスト比計算
  // 実際の実装では更に詳細な計算が必要
  
  const getLuminance = (color: string): number => {
    // 16進色をRGBに変換し、相対輝度を計算
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG AA準拠チェック
 */
export function isWCAGAACompliant(
  textColor: string,
  backgroundColor: string,
  fontSize: number
): boolean {
  const contrastRatio = calculateContrastRatio(textColor, backgroundColor);
  
  // 大きいテキスト（18pt以上、または14pt以上のボールド）は3:1、
  // それ以外は4.5:1のコントラスト比が必要
  const requiredRatio = fontSize >= 18 ? 3 : 4.5;
  
  return contrastRatio >= requiredRatio;
}

/**
 * スクリーンリーダー用の読み上げテキスト生成
 */
export function generateScreenReaderText(
  mainText: string,
  additionalInfo?: string[],
  state?: string
): string {
  let text = mainText;
  
  if (additionalInfo && additionalInfo.length > 0) {
    text += `。${additionalInfo.join('、')}`;
  }
  
  if (state) {
    text += `。${state}`;
  }
  
  return text;
}

// シングルトンインスタンス
export const accessibilityManager = AccessibilityManager.getInstance();