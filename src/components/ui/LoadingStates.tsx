/**
 * 改善されたローディング状態コンポーネント
 * 滑らかなアニメーションと状態別表示
 */

import React from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Animated,
  Dimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useFadeAnimation, useSpinAnimation, useScaleAnimation } from '@/hooks/useAnimations';

const { width, height } = Dimensions.get('window');

export interface LoadingStateProps {
  type?: 'overlay' | 'inline' | 'skeleton' | 'dots' | 'progress';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  progress?: number; // 0-100
  animated?: boolean;
}

/**
 * メインローディングコンポーネント
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'overlay',
  message = '読み込み中...',
  size = 'medium',
  color = colors.orange,
  progress,
  animated = true,
}) => {
  const { opacity, fadeIn } = useFadeAnimation(0);

  React.useEffect(() => {
    if (animated) {
      fadeIn();
    }
  }, [animated, fadeIn]);

  const containerStyle = [
    styles.container,
    type === 'overlay' && styles.overlay,
    type === 'inline' && styles.inline,
  ];

  const content = React.useMemo(() => {
    switch (type) {
      case 'skeleton':
        return <SkeletonLoader />;
      case 'dots':
        return <DotsLoader color={color} size={size} />;
      case 'progress':
        return <ProgressLoader progress={progress || 0} color={color} />;
      default:
        return <StandardLoader message={message} size={size} color={color} />;
    }
  }, [type, message, size, color, progress]);

  if (animated) {
    return (
      <Animated.View style={[containerStyle, { opacity }]}>
        {content}
      </Animated.View>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

/**
 * 標準ローディング（スピナー + メッセージ）
 */
const StandardLoader: React.FC<{
  message: string;
  size: string;
  color: string;
}> = ({ message, size, color }) => {
  const { spin, startSpin } = useSpinAnimation(1200, true);

  React.useEffect(() => {
    startSpin();
  }, [startSpin]);

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 24 : 32;
  const textSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  return (
    <View style={styles.standardLoader}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Feather name="loader" size={iconSize} color={color} />
      </Animated.View>
      <Text style={[styles.loadingText, { fontSize: textSize, color }]}>
        {message}
      </Text>
    </View>
  );
};

/**
 * ドットローディングアニメーション
 */
const DotsLoader: React.FC<{
  color: string;
  size: string;
}> = ({ color, size }) => {
  const dot1 = React.useRef(new Animated.Value(0.4)).current;
  const dot2 = React.useRef(new Animated.Value(0.4)).current;
  const dot3 = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const animateDots = () => {
      const duration = 600;
      const staggerDelay = 200;

      Animated.loop(
        Animated.sequence([
          Animated.stagger(staggerDelay, [
            Animated.timing(dot1, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 1, duration, useNativeDriver: true }),
          ]),
          Animated.stagger(staggerDelay, [
            Animated.timing(dot1, { toValue: 0.4, duration, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0.4, duration, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0.4, duration, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    animateDots();
  }, [dot1, dot2, dot3]);

  const dotSize = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    marginHorizontal: 3,
  };

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[dotStyle, { opacity: dot1 }]} />
      <Animated.View style={[dotStyle, { opacity: dot2 }]} />
      <Animated.View style={[dotStyle, { opacity: dot3 }]} />
    </View>
  );
};

/**
 * プログレスバーローディング
 */
const ProgressLoader: React.FC<{
  progress: number;
  color: string;
}> = ({ progress, color }) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressFill,
            { backgroundColor: color, width: progressWidth }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

/**
 * スケルトンローディング
 */
const SkeletonLoader: React.FC = () => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.skeletonText, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.skeletonText, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.skeletonTextShort, { opacity }]} />
    </View>
  );
};

/**
 * カードローディングスケルトン
 */
export const CardSkeleton: React.FC = () => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={styles.cardSkeleton}>
      <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonName, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.skeletonSubtext, { opacity }]} />
      </View>
    </View>
  );
};

/**
 * リストローディングスケルトン
 */
export const ListSkeleton: React.FC<{ itemCount?: number }> = ({ 
  itemCount = 5 
}) => {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: itemCount }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * ボタンローディング状態
 */
export const ButtonLoading: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}> = ({ loading, children, size = 'medium', color = colors.cream }) => {
  const { opacity: contentOpacity } = useFadeAnimation(loading ? 0 : 1);
  const { opacity: spinnerOpacity } = useFadeAnimation(loading ? 1 : 0);

  React.useEffect(() => {
    // アニメーションは自動的に実行される
  }, [loading]);

  const spinnerSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;

  return (
    <View style={styles.buttonLoading}>
      <Animated.View style={[styles.buttonContent, { opacity: contentOpacity }]}>
        {children}
      </Animated.View>
      {loading && (
        <Animated.View style={[styles.buttonSpinner, { opacity: spinnerOpacity }]}>
          <ActivityIndicator size={spinnerSize} color={color} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  inline: {
    padding: 20,
  },
  standardLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    width: 200,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.beige,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.charcoal,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
    width: width - 40,
  },
  skeletonLine: {
    backgroundColor: colors.beige,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    width: '70%',
  },
  skeletonText: {
    height: 16,
    width: '100%',
  },
  skeletonTextShort: {
    height: 16,
    width: '60%',
  },
  cardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: colors.cream,
    borderRadius: 12,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.beige,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonName: {
    height: 16,
    width: '60%',
    marginBottom: 8,
  },
  skeletonSubtext: {
    height: 14,
    width: '40%',
  },
  listSkeleton: {
    padding: 16,
  },
  buttonLoading: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpinner: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingState;