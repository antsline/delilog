/**
 * アプリ全体で使用する間隔（スペーシング）の定数
 */
export const spacing = {
  // 基本間隔
  xs: 4,
  sm: 8,
  md: 12,  // 標準間隔（カード間、ボタン間）
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // カード間隔
  card: 12,  // 業務前・業務後ボタン間の隙間を基準とした標準間隔

  // セクション間隔
  section: 12,  // セクション間の間隔

  // コンテナ間隔
  container: 20,  // ページ全体の左右マージン
  
  // 特殊な間隔
  header: 32,  // ヘッダー下部の間隔
  footer: 20,  // フッター上部の間隔
} as const;

/**
 * 使用方法の例:
 * 
 * import { spacing } from '@/constants/spacing';
 * 
 * const styles = StyleSheet.create({
 *   card: {
 *     marginBottom: spacing.card,
 *   },
 *   buttonRow: {
 *     gap: spacing.md,
 *   },
 * });
 */