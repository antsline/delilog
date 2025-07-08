/**
 * キーボード対応コンテナコンポーネント
 * キーボード表示時の自動スクロールと最適化
 */

import React from 'react';
import {
  View,
  ScrollView,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

interface KeyboardAwareContainerProps {
  children: React.ReactNode;
  extraScrollHeight?: number;
  enableResetScrollToCoords?: boolean;
  resetScrollToCoords?: { x: number; y: number };
  style?: any;
  contentContainerStyle?: any;
  scrollEnabled?: boolean;
}

export function KeyboardAwareContainer({
  children,
  extraScrollHeight = 50,
  enableResetScrollToCoords = true,
  resetScrollToCoords = { x: 0, y: 0 },
  style,
  contentContainerStyle,
  scrollEnabled = true,
}: KeyboardAwareContainerProps) {
  const { settings } = useAccessibilitySettings();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const keyboardHeight = React.useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const [screenHeight, setScreenHeight] = React.useState(Dimensions.get('window').height);

  React.useEffect(() => {
    const updateScreenHeight = () => {
      setScreenHeight(Dimensions.get('window').height);
    };

    const subscription = Dimensions.addEventListener('change', updateScreenHeight);
    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    const keyboardWillShow = (event: any) => {
      const { height, duration } = event;
      setIsKeyboardVisible(true);

      if (!settings.reduceMotion) {
        Animated.timing(keyboardHeight, {
          toValue: height,
          duration: duration || 250,
          useNativeDriver: false,
        }).start();
      } else {
        keyboardHeight.setValue(height);
      }
    };

    const keyboardWillHide = (event: any) => {
      const { duration } = event;
      setIsKeyboardVisible(false);

      if (!settings.reduceMotion) {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: duration || 250,
          useNativeDriver: false,
        }).start(() => {
          // キーボードが隠れた後、指定位置にスクロールをリセット
          if (enableResetScrollToCoords && scrollViewRef.current) {
            scrollViewRef.current.scrollTo(resetScrollToCoords);
          }
        });
      } else {
        keyboardHeight.setValue(0);
        if (enableResetScrollToCoords && scrollViewRef.current) {
          scrollViewRef.current.scrollTo(resetScrollToCoords);
        }
      }
    };

    const keyboardDidShow = keyboardWillShow;
    const keyboardDidHide = keyboardWillHide;

    let showListener: any;
    let hideListener: any;

    if (Platform.OS === 'ios') {
      showListener = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      hideListener = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
    } else {
      showListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      hideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    }

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, [
    keyboardHeight,
    settings.reduceMotion,
    enableResetScrollToCoords,
    resetScrollToCoords,
  ]);

  // フォーカスされた入力フィールドまでスクロール
  const scrollToInput = React.useCallback((inputRef: React.RefObject<any>) => {
    if (!scrollViewRef.current || !inputRef.current) return;

    inputRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      const currentKeyboardHeight = (keyboardHeight as any)._value || 0;
      const scrollY = y - (screenHeight - currentKeyboardHeight) / 2 + extraScrollHeight;
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: 0,
          y: Math.max(0, scrollY),
          animated: !settings.reduceMotion,
        });
      }
    });
  }, [screenHeight, extraScrollHeight, settings.reduceMotion]);

  // キーボードを閉じる
  const dismissKeyboard = React.useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          paddingBottom: keyboardHeight,
        },
        style,
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        bounces={Platform.OS === 'ios'}
      >
        {React.Children.map(children, (child, index) => {
          // TextInput要素にスクロール機能を追加
          if (React.isValidElement(child) && child.type && 
              (child.type as any).displayName === 'TextInput') {
            return React.cloneElement(child as React.ReactElement<any>, {
              onFocus: (event: any) => {
                // 既存のonFocusハンドラを呼び出し
                if ((child.props as any).onFocus) {
                  (child.props as any).onFocus(event);
                }
                
                // スクロール処理を追加
                setTimeout(() => {
                  scrollToInput({ current: event.target });
                }, 100);
              },
            });
          }
          return child;
        })}
      </ScrollView>

      {/* キーボード表示時のオーバーレイ（オプション） */}
      {isKeyboardVisible && (
        <View style={styles.keyboardOverlay} pointerEvents="none" />
      )}
    </Animated.View>
  );
}

/**
 * キーボード対応フォームフィールド
 */
export function KeyboardAwareTextInput({
  onFocus,
  onBlur,
  style,
  ...props
}: any) {
  const inputRef = React.useRef<any>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (event: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  return React.createElement('TextInput', {
    ref: inputRef,
    style: [
      style,
      isFocused && styles.focusedInput,
    ],
    onFocus: handleFocus,
    onBlur: handleBlur,
    ...props,
  });
}

/**
 * フォーカス管理フック
 */
export function useFocusManager() {
  const [currentFocusedField, setCurrentFocusedField] = React.useState<string | null>(null);
  const fieldRefs = React.useRef<Record<string, React.RefObject<any>>>({});

  const registerField = React.useCallback((fieldName: string, ref: React.RefObject<any>) => {
    fieldRefs.current[fieldName] = ref;
  }, []);

  const focusField = React.useCallback((fieldName: string) => {
    const fieldRef = fieldRefs.current[fieldName];
    if (fieldRef?.current) {
      fieldRef.current.focus();
      setCurrentFocusedField(fieldName);
    }
  }, []);

  const focusNextField = React.useCallback((currentField: string, nextField: string) => {
    const nextRef = fieldRefs.current[nextField];
    if (nextRef?.current) {
      nextRef.current.focus();
      setCurrentFocusedField(nextField);
    }
  }, []);

  const blurAllFields = React.useCallback(() => {
    Object.values(fieldRefs.current).forEach(ref => {
      if (ref?.current) {
        ref.current.blur();
      }
    });
    setCurrentFocusedField(null);
    Keyboard.dismiss();
  }, []);

  return {
    currentFocusedField,
    registerField,
    focusField,
    focusNextField,
    blurAllFields,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  focusedInput: {
    borderWidth: 2,
    borderColor: '#007AFF', // iOS標準のフォーカス色
  },
  keyboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default KeyboardAwareContainer;