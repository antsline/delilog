/**
 * 色覚障害対応サポート機能
 * 色のみに依存しない視覚的手がかりを提供
 */

import { colors } from '@/constants/colors';

// 色覚障害の種類
export type ColorBlindnessType = 
  | 'protanopia'    // 赤色覚異常（L錐体異常）
  | 'deuteranopia'  // 緑色覚異常（M錐体異常）  
  | 'tritanopia'    // 青色覚異常（S錐体異常）
  | 'achromatopsia' // 全色覚異常
  | 'normal';       // 正常色覚

// 状態を表すシンボル定数
export const StatusSymbols = {
  success: '✓',
  error: '✗', 
  warning: '⚠',
  info: 'ℹ',
  pending: '○',
  completed: '●',
  inProgress: '◐',
  disabled: '◯',
} as const;

// パターン定数（背景パターンやテクスチャ用）
export const StatusPatterns = {
  success: 'solid',
  error: 'diagonal-stripes',
  warning: 'dots',
  info: 'horizontal-lines',
  pending: 'outline',
  completed: 'solid',
  disabled: 'faded',
} as const;

/**
 * 色覚障害に対応した色の組み合わせを生成
 */
export function getColorBlindFriendlyColors(type: ColorBlindnessType): Record<string, string> {
  switch (type) {
    case 'protanopia':
    case 'deuteranopia':
      // 赤・緑の区別が困難なため、青・黄色系を使用
      return {
        primary: '#0066CC',      // 青
        secondary: '#FFB800',    // 黄色
        success: '#0066CC',      // 青（緑の代替）
        error: '#FF6600',        // オレンジ（赤の代替）
        warning: '#FFB800',      // 黄色
        info: '#666666',         // グレー
        background: '#FFFFFF',
        text: '#000000',
      };
      
    case 'tritanopia':
      // 青・黄色の区別が困難なため、赤・緑系を使用
      return {
        primary: '#CC0066',      // マゼンタ
        secondary: '#006600',    // 緑
        success: '#006600',      // 緑
        error: '#CC0000',        // 赤
        warning: '#FF6600',      // オレンジ（黄色の代替）
        info: '#666666',         // グレー
        background: '#FFFFFF',
        text: '#000000',
      };
      
    case 'achromatopsia':
      // 全色覚異常のため、グレースケールのみ使用
      return {
        primary: '#000000',
        secondary: '#666666',
        success: '#333333',
        error: '#000000',
        warning: '#666666',
        info: '#999999',
        background: '#FFFFFF',
        text: '#000000',
      };
      
    default:
      // 通常の色覚
      return {
        primary: colors.orange,
        secondary: colors.charcoal,
        success: colors.success,
        error: colors.error,
        warning: colors.orange,
        info: colors.charcoal,
        background: colors.cream,
        text: colors.charcoal,
      };
  }
}

/**
 * 状態表示用のアイコンとテキストを生成
 */
export function getStatusIndicator(
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'completed' | 'disabled',
  includeText: boolean = true
): {
  symbol: string;
  text: string;
  description: string;
} {
  const indicators = {
    success: {
      symbol: StatusSymbols.success,
      text: '完了',
      description: '正常に完了しました',
    },
    error: {
      symbol: StatusSymbols.error,
      text: 'エラー',
      description: 'エラーが発生しました',
    },
    warning: {
      symbol: StatusSymbols.warning,
      text: '警告',
      description: '注意が必要です',
    },
    info: {
      symbol: StatusSymbols.info,
      text: '情報',
      description: '参考情報です',
    },
    pending: {
      symbol: StatusSymbols.pending,
      text: '未実施',
      description: 'まだ実施されていません',
    },
    completed: {
      symbol: StatusSymbols.completed,
      text: '実施済み',
      description: '既に実施済みです',
    },
    disabled: {
      symbol: StatusSymbols.disabled,
      text: '無効',
      description: '利用できません',
    },
  };

  return indicators[status];
}

/**
 * 重要度を表す視覚的手がかりを生成
 */
export function getImportanceIndicator(
  level: 'critical' | 'high' | 'medium' | 'low'
): {
  border: {
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  prefix: string;
  description: string;
} {
  switch (level) {
    case 'critical':
      return {
        border: { width: 3, style: 'solid' },
        prefix: '【重要】',
        description: '緊急度最高',
      };
    case 'high':
      return {
        border: { width: 2, style: 'solid' },
        prefix: '【注意】',
        description: '重要事項',
      };
    case 'medium':
      return {
        border: { width: 1, style: 'dashed' },
        prefix: '【確認】',
        description: '通常事項',
      };
    case 'low':
      return {
        border: { width: 1, style: 'dotted' },
        prefix: '【参考】',
        description: '参考事項',
      };
  }
}

/**
 * カテゴリを表すアイコンマッピング
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    // 点呼関連
    'before-tenko': '🌅',
    'after-tenko': '🌇', 
    'vehicle': '🚛',
    'health': '❤️',
    'alcohol': '🧪',
    
    // 設定関連
    'profile': '👤',
    'security': '🔒',
    'notification': '🔔',
    'data': '💾',
    
    // 状態関連
    'online': '🌐',
    'offline': '📱',
    'sync': '🔄',
    'backup': '☁️',
    
    // 一般
    'default': '📋',
  };
  
  return iconMap[category] || iconMap.default;
}

/**
 * 色覚障害者向けの代替表現を生成
 */
export function createColorBlindFriendlyComponent(
  originalColor: string,
  status: 'success' | 'error' | 'warning' | 'info',
  type: ColorBlindnessType = 'normal'
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  symbol: string;
  pattern: string;
  accessibilityLabel: string;
} {
  const friendlyColors = getColorBlindFriendlyColors(type);
  const statusIndicator = getStatusIndicator(status);
  
  return {
    backgroundColor: friendlyColors[status] || friendlyColors.primary,
    borderColor: friendlyColors.text,
    textColor: friendlyColors.text,
    symbol: statusIndicator.symbol,
    pattern: StatusPatterns[status] || StatusPatterns.info,
    accessibilityLabel: `${statusIndicator.text}: ${statusIndicator.description}`,
  };
}

/**
 * 色覚障害対応チェック
 */
export function validateColorAccessibility(
  foreground: string,
  background: string
): {
  isProtanopiaFriendly: boolean;
  isDeuteranopiaFriendly: boolean;
  isTritanopiaFriendly: boolean;
  recommendations: string[];
} {
  // 簡略化された色覚障害シミュレーション
  // 実際の実装では、より精密な色変換アルゴリズムを使用
  
  const recommendations: string[] = [];
  
  // 赤・緑色覚異常対応チェック
  const redGreenSafe = !isRedGreenConfusing(foreground, background);
  if (!redGreenSafe) {
    recommendations.push('赤と緑の組み合わせは避け、アイコンやパターンで区別してください');
  }
  
  // 青・黄色覚異常対応チェック  
  const blueYellowSafe = !isBlueYellowConfusing(foreground, background);
  if (!blueYellowSafe) {
    recommendations.push('青と黄色の組み合わせは避け、明度差を大きくしてください');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('色覚障害への配慮が適切です');
  }
  
  return {
    isProtanopiaFriendly: redGreenSafe,
    isDeuteranopiaFriendly: redGreenSafe,
    isTritanopiaFriendly: blueYellowSafe,
    recommendations,
  };
}

/**
 * 赤・緑の混同チェック（簡略版）
 */
function isRedGreenConfusing(color1: string, color2: string): boolean {
  // 簡略化された判定
  // 実際の実装では、LMS色空間での変換が必要
  const isReddish = (color: string) => color.includes('red') || color.includes('#FF') || color === colors.error;
  const isGreenish = (color: string) => color.includes('green') || color.includes('#00FF') || color === colors.success;
  
  return (isReddish(color1) && isGreenish(color2)) || (isGreenish(color1) && isReddish(color2));
}

/**
 * 青・黄色の混同チェック（簡略版）
 */
function isBlueYellowConfusing(color1: string, color2: string): boolean {
  // 簡略化された判定
  const isBluish = (color: string) => color.includes('blue') || color.includes('#0000FF');
  const isYellowish = (color: string) => color.includes('yellow') || color.includes('#FFFF00') || color === colors.orange;
  
  return (isBluish(color1) && isYellowish(color2)) || (isYellowish(color1) && isBluish(color2));
}

/**
 * 高コントラストモード用のスタイル生成
 */
export function createHighContrastStyle(
  originalStyle: any,
  type: ColorBlindnessType = 'normal'
): any {
  const friendlyColors = getColorBlindFriendlyColors(type);
  
  return {
    ...originalStyle,
    backgroundColor: friendlyColors.background,
    color: friendlyColors.text,
    borderColor: friendlyColors.text,
    borderWidth: Math.max(originalStyle.borderWidth || 0, 2),
  };
}