/**
 * 音声入力サービス
 * 音声認識と音声合成機能を提供
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Logger } from '@/utils/logger';
import { Platform } from 'react-native';

export interface VoiceInputResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface VoiceInputOptions {
  language?: string;
  onInterimResult?: (text: string) => void;
  maxDuration?: number;
}

class VoiceInputService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private speechRecognitionSupported = false;

  constructor() {
    this.initializeService();
  }

  /**
   * サービスの初期化
   */
  private async initializeService() {
    try {
      // オーディオ権限の確認
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Logger.warn('音声録音の権限が許可されていません');
        return;
      }

      // オーディオモードの設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.speechRecognitionSupported = true;
      Logger.success('音声入力サービス初期化完了');
    } catch (error) {
      Logger.error('音声入力サービス初期化エラー', error);
    }
  }

  /**
   * 音声入力の開始
   */
  async startVoiceInput(options?: VoiceInputOptions): Promise<VoiceInputResult> {
    if (!this.speechRecognitionSupported) {
      return {
        success: false,
        error: '音声入力がサポートされていません'
      };
    }

    if (this.isRecording) {
      return {
        success: false,
        error: 'すでに録音中です'
      };
    }

    try {
      Logger.info('音声入力開始');
      this.isRecording = true;

      // 録音の準備
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {}
      });

      // 録音開始
      await recording.startAsync();
      this.recording = recording;

      // デモ用：仮の音声認識結果を返す
      // 実際の実装では、音声認識APIとの連携が必要
      return {
        success: true,
        text: 'デモ音声入力テキスト'
      };

    } catch (error) {
      Logger.error('音声入力開始エラー', error);
      this.isRecording = false;
      return {
        success: false,
        error: '音声入力の開始に失敗しました'
      };
    }
  }

  /**
   * 音声入力の停止
   */
  async stopVoiceInput(): Promise<VoiceInputResult> {
    if (!this.isRecording || !this.recording) {
      return {
        success: false,
        error: '録音中ではありません'
      };
    }

    try {
      Logger.info('音声入力停止');
      
      // 録音停止
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.recording = null;
      this.isRecording = false;

      // ここで音声認識APIに送信して結果を取得
      // デモ用の仮実装
      const recognizedText = await this.processAudioFile(uri);

      return {
        success: true,
        text: recognizedText
      };

    } catch (error) {
      Logger.error('音声入力停止エラー', error);
      this.isRecording = false;
      return {
        success: false,
        error: '音声入力の停止に失敗しました'
      };
    }
  }

  /**
   * 音声ファイルの処理（仮実装）
   */
  private async processAudioFile(uri: string | null): Promise<string> {
    if (!uri) return '';

    // 実際の実装では、以下のような処理が必要：
    // 1. 音声ファイルを音声認識APIに送信
    // 2. 認識結果を取得
    // 3. 日本語の文字起こしテキストを返す

    // デモ用のサンプルテキスト
    const sampleTexts = [
      '本日の健康状態は良好です。',
      '特に問題ありません。',
      '体調は良好で、業務に支障ありません。',
      '少し疲れていますが、運転に問題はありません。',
    ];

    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    return sampleTexts[randomIndex];
  }

  /**
   * テキスト読み上げ
   */
  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    try {
      const defaultOptions: Speech.SpeechOptions = {
        language: 'ja-JP',
        pitch: 1.0,
        rate: 1.0,
        ...options
      };

      await Speech.speak(text, defaultOptions);
      Logger.info('テキスト読み上げ完了', text);
    } catch (error) {
      Logger.error('テキスト読み上げエラー', error);
      throw new Error('テキストの読み上げに失敗しました');
    }
  }

  /**
   * 読み上げの停止
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      Logger.info('読み上げ停止');
    } catch (error) {
      Logger.error('読み上げ停止エラー', error);
    }
  }

  /**
   * 音声入力がサポートされているかチェック
   */
  isSupported(): boolean {
    return this.speechRecognitionSupported;
  }

  /**
   * 現在録音中かチェック
   */
  isRecordingNow(): boolean {
    return this.isRecording;
  }
}

// シングルトンインスタンス
export const voiceInputService = new VoiceInputService();