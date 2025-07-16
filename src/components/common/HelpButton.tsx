import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';

interface HelpButtonProps {
  /** ヘルプのタイプ */
  type?: 'global' | 'specific';
  /** 特定のヘルプコンテンツ（typeが'specific'の場合） */
  helpContent?: {
    title: string;
    description: string;
    steps?: string[];
  };
  /** ボタンのスタイル */
  variant?: 'icon' | 'text' | 'minimal';
  /** ボタンのサイズ */
  size?: 'small' | 'medium' | 'large';
}

export default function HelpButton({ 
  type = 'global',
  helpContent,
  variant = 'icon',
  size = 'medium'
}: HelpButtonProps) {
  
  const handlePress = () => {
    if (type === 'specific' && helpContent) {
      // 特定のヘルプコンテンツを表示
      const stepsText = helpContent.steps 
        ? '\n\n手順:\n' + helpContent.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
        : '';
      
      Alert.alert(
        helpContent.title,
        helpContent.description + stepsText,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'もっと詳しく', 
            onPress: () => router.push('/settings/help')
          }
        ]
      );
    } else {
      // グローバルヘルプセンターに移動
      router.push('/settings/help');
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // サイズ
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    else if (size === 'large') baseStyle.push(styles.buttonLarge);
    else baseStyle.push(styles.buttonMedium);

    // バリアント
    if (variant === 'text') baseStyle.push(styles.buttonText);
    else if (variant === 'minimal') baseStyle.push(styles.buttonMinimal);
    else baseStyle.push(styles.buttonIcon);

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonLabel];
    
    if (variant === 'text') baseStyle.push(styles.labelText);
    else if (variant === 'minimal') baseStyle.push(styles.labelMinimal);
    else baseStyle.push(styles.labelIcon);
    
    if (size === 'small') baseStyle.push(styles.labelSmall);
    else if (size === 'large') baseStyle.push(styles.labelLarge);
    
    return baseStyle;
  };

  const getButtonText = () => {
    if (variant === 'icon') return '?';
    if (variant === 'minimal') return '?';
    return 'ヘルプ';
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel="ヘルプを表示"
      accessibilityHint="この画面の使い方やよくある質問を確認できます"
    >
      <Text style={getTextStyle()}>
        {getButtonText()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  
  // サイズ
  buttonSmall: {
    width: 24,
    height: 24,
  },
  buttonMedium: {
    width: 32,
    height: 32,
  },
  buttonLarge: {
    width: 40,
    height: 40,
    paddingHorizontal: 12,
  },
  
  // バリアント
  buttonIcon: {
    backgroundColor: colors.orange,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  buttonText: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    width: 'auto',
    height: 'auto',
  },
  buttonMinimal: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  
  // テキストスタイル
  buttonLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  labelIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  labelText: {
    color: colors.orange,
    fontSize: 14,
  },
  labelMinimal: {
    color: colors.darkGray,
    fontSize: 14,
  },
  labelSmall: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 18,
  },
});