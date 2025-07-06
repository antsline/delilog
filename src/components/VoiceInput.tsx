import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { colors } from '@/constants/colors';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscription, disabled = false }) => {
  const [recording, setRecording] = useState<Audio.Recording>();
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    if (!recording) return;

    setIsRecording(false);
    setRecording(undefined);
    
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    
    // TODO: 音声認識API連携（Week 3では仮実装）
    // 現在は仮テキストを返す
    onTranscription('音声入力によるテキスト（仮実装）');
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.voiceButton,
        isRecording && styles.voiceButtonRecording,
        disabled && styles.voiceButtonDisabled
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.voiceButtonContent}>
        <View style={[
          styles.micIcon,
          isRecording && styles.micIconRecording
        ]}>
          <View style={[
            styles.micBody,
            isRecording && styles.micBodyRecording
          ]} />
          <View style={[
            styles.micBase,
            isRecording && styles.micBaseRecording
          ]} />
        </View>
        <Text style={[
          styles.voiceButtonText,
          isRecording && styles.voiceButtonTextRecording
        ]}>
          {isRecording ? '停止' : '音声入力'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  voiceButton: {
    backgroundColor: colors.orange,
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  voiceButtonRecording: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  voiceButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.beige,
  },
  voiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  micIcon: {
    width: 12,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  micIconRecording: {
    // Recording state styling
  },
  micBody: {
    width: 8,
    height: 10,
    backgroundColor: colors.cream,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.cream,
  },
  micBodyRecording: {
    backgroundColor: colors.cream,
    borderColor: colors.cream,
  },
  micBase: {
    width: 12,
    height: 2,
    backgroundColor: colors.cream,
    borderRadius: 1,
    marginTop: 2,
  },
  micBaseRecording: {
    backgroundColor: colors.cream,
  },
  voiceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
  },
  voiceButtonTextRecording: {
    color: colors.cream,
  },
});