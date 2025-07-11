import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

// 開発ビルドでのみVoiceをインポート
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  // Expo Goでは利用不可
  console.log('Voice module not available in Expo Go');
}

interface VoiceInputButtonProps {
  onVoiceResult: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onVoiceResult,
  placeholder = "音声入力",
  disabled = false,
  style
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  // Expo Goで実行されているかチェック
  const isExpoGo = !Voice;

  React.useEffect(() => {
    if (!Voice) return;

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    return () => {
      if (Voice && Voice.destroy) {
        Voice.destroy().then(() => {
          Voice.removeAllListeners();
        });
      }
    };
  }, []);

  const onSpeechStart = () => {
    setIsListening(true);
  };

  const onSpeechRecognized = () => {
    // 音声認識開始
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechError = (error: any) => {
    console.error('音声認識エラー:', error);
    setIsListening(false);
    Alert.alert('音声認識エラー', '音声認識に失敗しました。もう一度お試しください。');
  };

  const onSpeechResults = (event: any) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setRecognizedText(text);
      onVoiceResult(text);
    }
  };

  const onSpeechPartialResults = (event: any) => {
    if (event.value && event.value.length > 0) {
      setRecognizedText(event.value[0]);
    }
  };

  const onSpeechVolumeChanged = (event: any) => {
    // 音量変化処理（必要に応じて実装）
  };

  const startListening = async () => {
    if (!Voice) {
      Alert.alert(
        '音声入力は利用できません',
        'この機能は開発ビルドでのみ利用可能です。Expo Goでは動作しません。',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setRecognizedText('');
      await Voice.start('ja-JP'); // 日本語設定
    } catch (error) {
      console.error('音声認識開始エラー:', error);
      Alert.alert('エラー', '音声認識を開始できませんでした。');
    }
  };

  const stopListening = async () => {
    if (!Voice) return;
    
    try {
      await Voice.stop();
    } catch (error) {
      console.error('音声認識停止エラー:', error);
    }
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Expo Goの場合は無効化されたボタンを表示
  const isDisabledInExpoGo = isExpoGo || disabled;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          isListening && styles.buttonListening,
          isDisabledInExpoGo && styles.buttonDisabled
        ]}
        onPress={handlePress}
        disabled={isDisabledInExpoGo}
      >
        <Feather 
          name={isListening ? "mic" : "mic-off"} 
          size={20} 
          color={isListening ? colors.error : (isDisabledInExpoGo ? colors.darkGray : colors.charcoal)} 
        />
        <Text style={[
          styles.buttonText,
          isListening && styles.buttonTextListening,
          isDisabledInExpoGo && styles.buttonTextDisabled
        ]}>
          {isExpoGo ? '音声入力（開発ビルド必要）' : (isListening ? '録音中...' : placeholder)}
        </Text>
      </TouchableOpacity>
      
      {recognizedText && !isExpoGo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{recognizedText}</Text>
        </View>
      )}

      {isExpoGo && (
        <Text style={styles.infoText}>
          ※ 音声入力機能は開発ビルドでのみ利用可能です
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  buttonListening: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error,
  },
  buttonDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray,
  },
  buttonText: {
    fontSize: 16,
    color: colors.charcoal,
    fontWeight: '500',
  },
  buttonTextListening: {
    color: colors.error,
  },
  buttonTextDisabled: {
    color: colors.darkGray,
  },
  resultContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.success + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  resultText: {
    fontSize: 14,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VoiceInputButton;