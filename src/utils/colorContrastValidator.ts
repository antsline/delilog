/**
 * カラーコントラスト検証ユーティリティ
 * WCAG 2.1 AA基準でのコントラスト比チェック
 */

import { colors } from '@/constants/colors';
import { calculateContrastRatio, isWCAGAACompliant } from './accessibility';

interface ColorPair {
  foreground: string;
  background: string;
  usage: string;
  fontSize: number;
}

// アプリで使用される色の組み合わせ
const colorPairs: ColorPair[] = [
  // ボタン
  { foreground: colors.cream, background: colors.orange, usage: '業務前点呼ボタン', fontSize: 18 },
  { foreground: colors.cream, background: colors.charcoal, usage: '業務後点呼ボタン', fontSize: 18 },
  
  // テキスト
  { foreground: colors.charcoal, background: colors.cream, usage: 'メインテキスト', fontSize: 16 },
  { foreground: colors.darkGray, background: colors.cream, usage: 'サブテキスト', fontSize: 14 },
  
  // 状態表示
  { foreground: colors.success, background: colors.cream, usage: '成功状態', fontSize: 12 },
  { foreground: colors.error, background: colors.cream, usage: 'エラー状態', fontSize: 12 },
  { foreground: colors.orange, background: colors.cream, usage: '警告状態', fontSize: 12 },
  
  // フォーム
  { foreground: colors.charcoal, background: '#FFFFFF', usage: 'フォーム入力', fontSize: 16 },
  { foreground: colors.darkGray, background: colors.beige, usage: 'フォームラベル', fontSize: 14 },
  
  // ナビゲーション
  { foreground: colors.charcoal, background: colors.cream, usage: 'タブアクティブ', fontSize: 12 },
  { foreground: colors.darkGray, background: colors.cream, usage: 'タブ非アクティブ', fontSize: 12 },
];

/**
 * すべての色の組み合わせをチェック
 */
export function validateAllColorContrasts(): {
  passed: ColorPair[];
  failed: ColorPair[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
} {
  const passed: ColorPair[] = [];
  const failed: ColorPair[] = [];

  colorPairs.forEach(pair => {
    const isCompliant = isWCAGAACompliant(pair.foreground, pair.background, pair.fontSize);
    const contrastRatio = calculateContrastRatio(pair.foreground, pair.background);
    
    const result = {
      ...pair,
      contrastRatio,
      isCompliant,
    };

    if (isCompliant) {
      passed.push(result as any);
    } else {
      failed.push(result as any);
    }
  });

  const summary = {
    total: colorPairs.length,
    passed: passed.length,
    failed: failed.length,
    passRate: Math.round((passed.length / colorPairs.length) * 100),
  };

  return { passed, failed, summary };
}

/**
 * 改善提案を生成
 */
export function generateContrastImprovements(): string[] {
  const { failed } = validateAllColorContrasts();
  const improvements: string[] = [];

  failed.forEach(pair => {
    const currentRatio = calculateContrastRatio(pair.foreground, pair.background);
    const requiredRatio = pair.fontSize >= 18 ? 3 : 4.5;
    
    improvements.push(
      `「${pair.usage}」のコントラスト比を${currentRatio.toFixed(2)}:1から${requiredRatio}:1以上に改善する必要があります。`
    );
  });

  if (improvements.length === 0) {
    improvements.push('すべての色の組み合わせがWCAG AA基準を満たしています。');
  }

  return improvements;
}

/**
 * 色の明度を調整してコントラストを改善
 */
export function adjustColorForContrast(
  foregroundColor: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string {
  // 簡略化された色調整
  // 実際の実装では、HSL変換などを使用してより精密な調整を行う
  
  let adjustedColor = foregroundColor;
  let ratio = calculateContrastRatio(adjustedColor, backgroundColor);
  
  if (ratio < targetRatio) {
    // 前景色を暗くするか明るくするかを決定
    const shouldDarken = backgroundColor === colors.cream || backgroundColor === '#FFFFFF';
    
    if (shouldDarken) {
      // より暗い色に調整
      adjustedColor = adjustColor(foregroundColor, -0.2);
    } else {
      // より明るい色に調整
      adjustedColor = adjustColor(foregroundColor, 0.2);
    }
  }
  
  return adjustedColor;
}

/**
 * 色の明度を調整
 */
function adjustColor(color: string, factor: number): string {
  // 16進色をRGBに変換
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + factor * 255));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + factor * 255));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + factor * 255));
  
  // RGBを16進色に戻す
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * 高コントラストモード用の色を生成
 */
export function generateHighContrastColors(): Record<string, string> {
  return {
    // テキスト色
    primaryText: '#000000',
    secondaryText: '#333333',
    inverseText: '#FFFFFF',
    
    // 背景色
    primaryBackground: '#FFFFFF',
    secondaryBackground: '#F5F5F5',
    inverseBackground: '#000000',
    
    // アクセント色
    primary: '#0066CC',
    success: '#006600',
    warning: '#FF8800',
    error: '#CC0000',
    
    // ボーダー
    border: '#666666',
    divider: '#CCCCCC',
  };
}

/**
 * コントラスト比レポートを生成
 */
export function generateContrastReport(): string {
  const { passed, failed, summary } = validateAllColorContrasts();
  
  let report = `# カラーコントラスト検証レポート\n\n`;
  report += `## 概要\n`;
  report += `- 総検証数: ${summary.total}組\n`;
  report += `- 合格数: ${summary.passed}組\n`;
  report += `- 不合格数: ${summary.failed}組\n`;
  report += `- 合格率: ${summary.passRate}%\n\n`;
  
  if (failed.length > 0) {
    report += `## 改善が必要な色の組み合わせ\n\n`;
    failed.forEach((pair: any) => {
      report += `### ${pair.usage}\n`;
      report += `- 前景色: ${pair.foreground}\n`;
      report += `- 背景色: ${pair.background}\n`;
      report += `- 現在のコントラスト比: ${pair.contrastRatio.toFixed(2)}:1\n`;
      report += `- 必要なコントラスト比: ${pair.fontSize >= 18 ? '3.0' : '4.5'}:1\n\n`;
    });
  }
  
  if (passed.length > 0) {
    report += `## 合格した色の組み合わせ\n\n`;
    passed.forEach((pair: any) => {
      report += `- ${pair.usage}: ${pair.contrastRatio.toFixed(2)}:1\n`;
    });
  }
  
  return report;
}