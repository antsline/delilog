/**
 * 統一されたローディング表示コンポーネント
 * アクセシビリティ対応とマイクロアニメーション付き
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  Easing 
} from 'react-native';
import { colors } from '@/constants/colors';
import { createAccessibleProps, AccessibilityRoles } from '@/utils/accessibility';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  color?: string;
  backgroundColor?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
}

export function LoadingSpinner({
  size = 'medium',
  text = '読み込み中...',
  overlay = false,
  color = colors.orange,
  backgroundColor = colors.cream,
  showProgress = false,
  progress = 0,
}: LoadingSpinnerProps) {
  const { settings, getScaledFontSize } = useAccessibilitySettings();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // エントランスアニメーション（アニメーション削減時はスキップ）
    if (!settings.reduceMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [fadeAnim, scaleAnim, settings.reduceMotion]);

  React.useEffect(() => {
    if (showProgress && !settings.reduceMotion) {
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress / 100);
    }
  }, [progress, progressAnim, showProgress, settings.reduceMotion]);

  const getSpinnerSize = () => {
    const sizes = {
      small: 20,
      medium: 32,
      large: 48,
    };
    return sizes[size];
  };

  const getTextSize = () => {
    const baseSizes = {
      small: 12,
      medium: 14,
      large: 16,
    };
    return getScaledFontSize(baseSizes[size]);
  };

  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    { backgroundColor: overlay ? `${backgroundColor}E6` : 'transparent' },
  ];

  const contentStyle = [
    styles.content,
    !overlay && { backgroundColor },
    {
      opacity: settings.reduceMotion ? 1 : fadeAnim,
      transform: settings.reduceMotion ? [] : [{ scale: scaleAnim }],
    },
  ];

  return (
    <View 
      style={containerStyle}
      {...createAccessibleProps(
        text,
        'データを読み込んでいます。しばらくお待ちください。',
        AccessibilityRoles.ALERT
      )}
    >
      <Animated.View style={contentStyle}>
        {/* スピナー */}
        <ActivityIndicator 
          size={getSpinnerSize()} 
          color={color} 
          style={styles.spinner}
        />
        
        {/* テキスト */}
        {text && (
          <Text 
            style={[
              styles.text,
              { 
                fontSize: getTextSize(),
                color: settings.highContrastMode ? colors.charcoal : colors.darkGray,
              }
            ]}
          >
            {text}
          </Text>
        )}

        {/* プログレスバー */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.beige }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: color,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { fontSize: getScaledFontSize(12) }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/**
 * フルスクリーンローディング
 */
export function FullScreenLoading(props: Omit<LoadingSpinnerProps, 'overlay'>) {
  return <LoadingSpinner {...props} overlay={true} />;
}

/**
 * インラインローディング
 */
export function InlineLoading(props: LoadingSpinnerProps) {
  return <LoadingSpinner {...props} overlay={false} size="small" />;
}

/**
 * ボタン内ローディング
 */
export function ButtonLoading({ color = colors.cream }: { color?: string }) {
  return (
    <ActivityIndicator 
      size="small" 
      color={color} 
      style={styles.buttonSpinner}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    minWidth: 120,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  spinner: {
    marginBottom: 12,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: colors.darkGray,
    fontWeight: '600',
  },
  buttonSpinner: {
    marginHorizontal: 8,
  },
});

export default LoadingSpinner;