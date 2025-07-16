import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  BackHandler
} from 'react-native';
import { colors } from '@/constants/colors';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // 今後の拡張用
  position?: 'top' | 'bottom' | 'center';
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({
  visible,
  steps,
  onComplete,
  onSkip
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleSkip();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(0);
      onComplete();
    });
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(0);
      onSkip();
    });
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!visible || !currentStepData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* 背景の暗い部分 */}
        <View style={styles.backdrop} />
        
        {/* チュートリアルコンテンツ */}
        <View style={styles.contentContainer}>
          <View style={styles.content}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.stepIndicator}>
                {currentStep + 1} / {steps.length}
              </Text>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>スキップ</Text>
              </TouchableOpacity>
            </View>

            {/* メインコンテンツ */}
            <View style={styles.mainContent}>
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>
            </View>

            {/* プログレスインジケーター */}
            <View style={styles.progressContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                    index < currentStep && styles.progressDotCompleted
                  ]}
                />
              ))}
            </View>

            {/* ナビゲーションボタン */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton, currentStep === 0 && styles.navButtonDisabled]}
                onPress={handlePrevious}
                disabled={currentStep === 0}
                activeOpacity={0.7}
              >
                <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
                  戻る
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? '完了' : '次へ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentContainer: {
    width: '90%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.orange,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '500',
  },
  mainContent: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkGray,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.beige,
  },
  progressDotActive: {
    backgroundColor: colors.orange,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: colors.success,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.beige,
  },
  nextButton: {
    backgroundColor: colors.orange,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  navButtonTextDisabled: {
    color: colors.darkGray,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});