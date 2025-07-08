/**
 * アニメーション付きボタンコンポーネント
 * タッチフィードバックとマイクロアニメーション
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { createAccessibleProps, AccessibilityRoles } from '@/utils/accessibility';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { ButtonLoading } from './LoadingSpinner';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hapticFeedback?: boolean;
}

export function AnimatedButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  hapticFeedback = true,
}: AnimatedButtonProps) {
  const { settings, getScaledFontSize } = useAccessibilitySettings();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading || settings.reduceMotion) return;

    // ハプティックフィードバック
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // プレスアニメーション
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading || settings.reduceMotion) return;

    // リリースアニメーション
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // 成功時のハプティックフィードバック
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: colors.orange,
        textColor: colors.cream,
        borderColor: colors.orange,
      },
      secondary: {
        backgroundColor: colors.cream,
        textColor: colors.charcoal,
        borderColor: colors.charcoal,
      },
      danger: {
        backgroundColor: colors.error,
        textColor: colors.cream,
        borderColor: colors.error,
      },
      success: {
        backgroundColor: colors.success,
        textColor: colors.cream,
        borderColor: colors.success,
      },
    };

    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 12,
        borderRadius: 6,
      },
      medium: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        borderRadius: 8,
      },
      large: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        fontSize: 16,
        borderRadius: 12,
      },
    };

    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isInteractionDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      borderRadius: sizeStyles.borderRadius,
      opacity: isInteractionDisabled ? 0.5 : 1,
    },
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    {
      color: variantStyles.textColor,
      fontSize: getScaledFontSize(sizeStyles.fontSize),
    },
    textStyle,
  ];

  const animatedStyle = settings.reduceMotion
    ? {}
    : {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        style={buttonStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInteractionDisabled}
        {...createAccessibleProps(
          accessibilityLabel || title,
          accessibilityHint,
          AccessibilityRoles.BUTTON,
          { disabled: isInteractionDisabled }
        )}
      >
        {loading ? (
          <ButtonLoading color={variantStyles.textColor} />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text style={buttonTextStyle}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * フローティングアクションボタン
 */
export function FloatingActionButton({
  onPress,
  icon,
  accessibilityLabel = 'フローティングアクションボタン',
  style,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const { settings } = useAccessibilitySettings();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (settings.reduceMotion) return;

    Animated.spring(scaleAnim, {
      toValue: 0.9,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (settings.reduceMotion) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = settings.reduceMotion
    ? styles.fab
    : [styles.fab, { transform: [{ scale: scaleAnim }] }];

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fabButton}
        {...createAccessibleProps(
          accessibilityLabel,
          'ダブルタップしてアクションを実行',
          AccessibilityRoles.BUTTON
        )}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 8,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orange,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
});

export default AnimatedButton;