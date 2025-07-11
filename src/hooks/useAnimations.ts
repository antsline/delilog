/**
 * アニメーションシステム
 * 滑らかで一貫性のあるアニメーション効果を提供
 */

import React from 'react';
import { Animated, Easing } from 'react-native';

export interface AnimationConfig {
  duration?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

export const ANIMATION_PRESETS = {
  // 基本アニメーション
  quick: { duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true },
  standard: { duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true },
  slow: { duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true },
  
  // 特殊効果
  bounce: { duration: 400, easing: Easing.bounce, useNativeDriver: true },
  elastic: { duration: 600, easing: Easing.elastic(1), useNativeDriver: true },
  spring: { duration: 350, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), useNativeDriver: true },
  
  // UI要素専用
  fade: { duration: 250, easing: Easing.linear, useNativeDriver: true },
  slide: { duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true },
  scale: { duration: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true },
} as const;

/**
 * フェードアニメーションフック
 */
export function useFadeAnimation(
  initialValue: number = 0,
  config: AnimationConfig = ANIMATION_PRESETS.fade
) {
  const fadeAnim = React.useRef(new Animated.Value(initialValue)).current;

  const fadeIn = React.useCallback((toValue: number = 1, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue,
        duration: customConfig?.duration || config.duration || 300,
        easing: customConfig?.easing || config.easing || Easing.linear,
        useNativeDriver: customConfig?.useNativeDriver ?? config.useNativeDriver ?? true,
      }).start(() => resolve());
    });
  }, [fadeAnim, config]);

  const fadeOut = React.useCallback((toValue: number = 0, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue,
        duration: customConfig?.duration || config.duration || 300,
        easing: customConfig?.easing || config.easing || Easing.linear,
        useNativeDriver: customConfig?.useNativeDriver ?? config.useNativeDriver ?? true,
      }).start(() => resolve());
    });
  }, [fadeAnim, config]);

  const fadeToggle = React.useCallback((customConfig?: Partial<AnimationConfig>) => {
    const currentValue = (fadeAnim as any)._value;
    const targetValue = currentValue > 0.5 ? 0 : 1;
    
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: targetValue,
        duration: customConfig?.duration || config.duration || 300,
        easing: customConfig?.easing || config.easing || Easing.linear,
        useNativeDriver: customConfig?.useNativeDriver ?? config.useNativeDriver ?? true,
      }).start(() => resolve());
    });
  }, [fadeAnim, config]);

  return {
    opacity: fadeAnim,
    fadeIn,
    fadeOut,
    fadeToggle,
  };
}

/**
 * スライドアニメーションフック
 */
export function useSlideAnimation(
  initialValue: number = 0,
  config: AnimationConfig = ANIMATION_PRESETS.slide
) {
  const slideAnim = React.useRef(new Animated.Value(initialValue)).current;

  const slideIn = React.useCallback((toValue: number = 0, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(slideAnim, {
        toValue,
        ...config,
        ...customConfig,
      }).start(() => resolve());
    });
  }, [slideAnim, config]);

  const slideOut = React.useCallback((toValue: number, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(slideAnim, {
        toValue,
        ...config,
        ...customConfig,
      }).start(() => resolve());
    });
  }, [slideAnim, config]);

  return {
    translateX: slideAnim,
    translateY: slideAnim,
    slideIn,
    slideOut,
  };
}

/**
 * スケールアニメーションフック
 */
export function useScaleAnimation(
  initialValue: number = 1,
  config: AnimationConfig = ANIMATION_PRESETS.scale
) {
  const scaleAnim = React.useRef(new Animated.Value(initialValue)).current;

  const scaleIn = React.useCallback((toValue: number = 1, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(scaleAnim, {
        toValue,
        ...config,
        ...customConfig,
      }).start(() => resolve());
    });
  }, [scaleAnim, config]);

  const scaleOut = React.useCallback((toValue: number = 0, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.timing(scaleAnim, {
        toValue,
        ...config,
        ...customConfig,
      }).start(() => resolve());
    });
  }, [scaleAnim, config]);

  const scalePulse = React.useCallback((pulseScale: number = 1.1, customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: pulseScale,
          ...config,
          ...customConfig,
          duration: (customConfig?.duration || config.duration) / 2,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          ...config,
          ...customConfig,
          duration: (customConfig?.duration || config.duration) / 2,
        }),
      ]).start(() => resolve());
    });
  }, [scaleAnim, config]);

  return {
    scale: scaleAnim,
    scaleIn,
    scaleOut,
    scalePulse,
  };
}

/**
 * 複合アニメーションフック（フェード + スライド）
 */
export function useFadeSlideAnimation(
  initialOpacity: number = 0,
  initialTranslate: number = 50,
  config: AnimationConfig = ANIMATION_PRESETS.standard
) {
  const opacity = React.useRef(new Animated.Value(initialOpacity)).current;
  const translateY = React.useRef(new Animated.Value(initialTranslate)).current;

  const animateIn = React.useCallback((customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          ...config,
          ...customConfig,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          ...config,
          ...customConfig,
        }),
      ]).start(() => resolve());
    });
  }, [opacity, translateY, config]);

  const animateOut = React.useCallback((customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          ...config,
          ...customConfig,
        }),
        Animated.timing(translateY, {
          toValue: initialTranslate,
          ...config,
          ...customConfig,
        }),
      ]).start(() => resolve());
    });
  }, [opacity, translateY, config, initialTranslate]);

  return {
    opacity,
    translateY,
    animateIn,
    animateOut,
  };
}

/**
 * リスト項目のスタガード（順次）アニメーション
 */
export function useStaggeredAnimation(
  itemCount: number,
  staggerDelay: number = 100,
  config: AnimationConfig = ANIMATION_PRESETS.standard
) {
  const animations = React.useRef(
    Array.from({ length: itemCount }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  const animateInStaggered = React.useCallback((customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      const animationsToRun = animations.map((anim, index) => 
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            ...config,
            ...customConfig,
            delay: index * staggerDelay,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            ...config,
            ...customConfig,
            delay: index * staggerDelay,
          }),
        ])
      );

      Animated.stagger(staggerDelay, animationsToRun).start(() => resolve());
    });
  }, [animations, staggerDelay, config]);

  const animateOutStaggered = React.useCallback((customConfig?: Partial<AnimationConfig>) => {
    return new Promise<void>((resolve) => {
      const animationsToRun = animations.map((anim, index) => 
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0,
            ...config,
            ...customConfig,
            delay: (animations.length - index - 1) * staggerDelay,
          }),
          Animated.timing(anim.translateY, {
            toValue: 30,
            ...config,
            ...customConfig,
            delay: (animations.length - index - 1) * staggerDelay,
          }),
        ])
      );

      Animated.stagger(staggerDelay, animationsToRun).start(() => resolve());
    });
  }, [animations, staggerDelay, config]);

  return {
    animations,
    animateInStaggered,
    animateOutStaggered,
  };
}

/**
 * タップフィードバックアニメーション
 */
export function useTapFeedback(
  feedbackScale: number = 0.95,
  config: AnimationConfig = ANIMATION_PRESETS.quick
) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onPressIn = React.useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: feedbackScale,
      ...config,
    }).start();
  }, [scaleAnim, feedbackScale, config]);

  const onPressOut = React.useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      ...config,
    }).start();
  }, [scaleAnim, config]);

  return {
    scale: scaleAnim,
    onPressIn,
    onPressOut,
  };
}

/**
 * ローディングスピナーアニメーション
 */
export function useSpinAnimation(
  duration: number = 1000,
  continuous: boolean = true
) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  const startSpin = React.useCallback(() => {
    const spinAnimation = Animated.timing(spinValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    if (continuous) {
      Animated.loop(spinAnimation).start();
    } else {
      spinAnimation.start(() => {
        spinValue.setValue(0);
      });
    }
  }, [spinValue, duration, continuous]);

  const stopSpin = React.useCallback(() => {
    spinValue.stopAnimation();
    spinValue.setValue(0);
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    spin,
    startSpin,
    stopSpin,
  };
}