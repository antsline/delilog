/**
 * 音声入力ボタンコンポーネント
 * マイクボタンのUI と音声入力機能を提供
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voiceInputService } from '@/services/voiceInputService';
import { useSubscriptionStatus } from '@/store/subscriptionStore';
import { colors } from '@/constants/colors';
import { Logger } from '@/utils/logger';

interface VoiceInputButtonProps {
  onVoiceInput: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function VoiceInputButton({ 
  onVoiceInput, 
  placeholder = '音声入力',
  disabled = false 
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isBasic } = useSubscriptionStatus();
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (isRecording) {
      // 録音中のアニメーション
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handlePress = async () => {
    // ベーシックプランチェック
    if (!isBasic) {
      Alert.alert(
        '音声入力機能',
        'この機能はベーシックプラン限定です。業務効率化のために音声入力をお試しください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: 'プランを見る', 
            onPress: () => {
              // サブスクリプション画面に遷移
              // router.push('/subscription');
            }
          }
        ]
      );
      return;
    }

    if (disabled || isProcessing) return;

    if (isRecording) {
      // 録音停止
      setIsProcessing(true);
      try {
        const result = await voiceInputService.stopVoiceInput();
        if (result.success && result.text) {
          onVoiceInput(result.text);
          await voiceInputService.speak('入力を確認しました');
        } else {
          Alert.alert('エラー', result.error || '音声認識に失敗しました');
        }
      } catch (error) {
        Logger.error('音声入力停止エラー', error);
        Alert.alert('エラー', '音声入力の処理に失敗しました');
      } finally {
        setIsRecording(false);
        setIsProcessing(false);
      }
    } else {
      // 録音開始
      const result = await voiceInputService.startVoiceInput();
      if (result.success) {
        setIsRecording(true);
        // ガイド音声
        await voiceInputService.speak('音声入力を開始しました');
      } else {
        Alert.alert('エラー', result.error || '音声入力を開始できません');
      }
    }
  };

  if (!voiceInputService.isSupported()) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabled,
        !isBasic && styles.locked,
      ]}
      onPress={handlePress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.cream} size="small" />
        ) : (
          <>
            <Ionicons 
              name={isRecording ? 'stop' : 'mic'} 
              size={24} 
              color={isBasic ? colors.cream : colors.darkGray}
            />
            {!isBasic && (
              <Ionicons 
                name="lock-closed" 
                size={12} 
                color={colors.darkGray}
                style={styles.lockIcon}
              />
            )}
          </>
        )}
      </Animated.View>
      
      {isRecording && (
        <Text style={styles.recordingText}>録音中...</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  locked: {
    opacity: 0.8,
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  recordingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
});