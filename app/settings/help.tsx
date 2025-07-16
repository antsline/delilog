import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import TutorialOverlay from '@/components/common/TutorialOverlay';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'basic' | 'record' | 'data' | 'trouble';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '点呼記録とは何ですか？',
    answer: '貨物軽自動車運送事業者に義務付けられている運転者の健康状態や車両状況を記録する制度です。業務前と業務後に実施する必要があります。',
    category: 'basic'
  },
  {
    id: '2',
    question: '業務前点呼で記録する項目は？',
    answer: '運転者の健康状態、アルコール検知、睡眠不足の有無、車両の点検状況、運行経路などを記録します。',
    category: 'record'
  },
  {
    id: '3',
    question: 'アルコール検知値はどう入力しますか？',
    answer: 'アルコール検知器の数値を直接入力してください。0.00mg/L未満で「検知なし」、0.00mg/L以上で「検知あり」と自動判定されます。',
    category: 'record'
  },
  {
    id: '4',
    question: '記録を間違えて入力した場合は？',
    answer: '現在、記録の編集機能は法令確認中のため利用できません。新しい記録を作成することをお勧めします。',
    category: 'trouble'
  },
  {
    id: '5',
    question: 'PDFの生成ができません',
    answer: '記録一覧画面で該当する週の記録を確認し、PDFボタンをタップしてください。データが不完全な場合は生成できない場合があります。',
    category: 'data'
  },
  {
    id: '10',
    question: '同日に複数回運行した場合、PDFではどう表示されますか？',
    answer: '同日中に複数の業務を行った場合、車両番号の後に(1)(2)などの番号を付けて別々の行に表示されます。例：1234(1)、1234(2)のように区別されます。週次PDFでは最大12行まで表示されるため、複数業務がある場合も適切に表示されます。',
    category: 'data'
  },
  {
    id: '6',
    question: 'オフラインでも使用できますか？',
    answer: 'はい。オフライン環境でも点呼記録の作成が可能です。オンライン復帰時に自動的に同期されます。',
    category: 'basic'
  },
  {
    id: '7',
    question: '車両を追加・変更するには？',
    answer: '設定画面の「車両管理」から車両の追加・編集・削除が可能です。',
    category: 'basic'
  },
  {
    id: '8',
    question: 'データのバックアップは可能ですか？',
    answer: '設定画面の「データ管理」からCSVファイルとしてエクスポートが可能です。',
    category: 'data'
  },
  {
    id: '9',
    question: '「次の業務を開始」ボタンが表示されるのはなぜですか？',
    answer: '業務前点呼と業務後点呼の両方が完了すると、一つの業務が終了したことを示すため「次の業務を開始」ボタンが表示されます。同日中に複数の業務（シフト）を行う場合、このボタンを押すことで新しい業務前点呼を開始できます。日付が変わると自動的にリセットされます。',
    category: 'basic'
  }
];

const categoryNames = {
  basic: '基本操作',
  record: '点呼記録',
  data: 'データ管理',
  trouble: 'トラブル'
};

const tutorialSteps = [
  {
    id: '1',
    title: 'delilogへようこそ！',
    description: '点呼記録を簡単に管理できるアプリです。基本的な使い方をご案内します。',
    position: 'center' as const
  },
  {
    id: '2',
    title: '業務前点呼の記録',
    description: 'ホーム画面から「業務前点呼」をタップして、出発前の健康状態や車両点検結果を記録します。',
    position: 'center' as const
  },
  {
    id: '3',
    title: '業務後点呼の記録',
    description: '業務終了後は「業務後点呼」で運行状況や健康状態を記録してください。',
    position: 'center' as const
  },
  {
    id: '4',
    title: '記録の確認',
    description: '記録一覧画面で過去の点呼記録を確認できます。月単位で見ることができます。',
    position: 'center' as const
  },
  {
    id: '5',
    title: 'PDF出力',
    description: '記録一覧から週次のPDFレポートを生成して、印刷や保存ができます。',
    position: 'center' as const
  }
];

export default function HelpScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState(false);

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const handleFAQPress = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? '' : id);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'サポートへのお問い合わせ',
      '解決しない問題がございましたら、アプリストアのレビューまたは開発者へ直接お問い合わせください。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'アプリストアレビュー', 
          onPress: () => {
            // アプリストアのレビューページを開く（実装時にはアプリのURLを使用）
            console.log('アプリストアレビューを開く');
          }
        }
      ]
    );
  };

  const handleTutorial = () => {
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹ 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ヘルプセンター</Text>
        </View>

        {/* クイックアクション */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTutorial}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>📚 基本操作ガイド</Text>
            <Text style={styles.actionButtonSubtext}>初めての方はこちら</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>💬 サポート</Text>
            <Text style={styles.actionButtonSubtext}>お問い合わせ</Text>
          </TouchableOpacity>
        </View>

        {/* よくある質問セクション */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>よくある質問</Text>
          
          {/* カテゴリフィルター */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextActive]}>
                すべて
              </Text>
            </TouchableOpacity>
            
            {Object.entries(categoryNames).map(([key, name]) => (
              <TouchableOpacity
                key={key}
                style={[styles.categoryButton, selectedCategory === key && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === key && styles.categoryButtonTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ リスト */}
          <View style={styles.faqList}>
            {filteredFAQs.map((item) => (
              <View key={item.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => handleFAQPress(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <Text style={[styles.faqArrow, expandedFAQ === item.id && styles.faqArrowExpanded]}>
                    ›
                  </Text>
                </TouchableOpacity>
                
                {expandedFAQ === item.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 用語解説セクション */}
        <View style={styles.glossarySection}>
          <Text style={styles.sectionTitle}>用語解説</Text>
          
          <View style={styles.glossaryList}>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryTerm}>点呼</Text>
              <Text style={styles.glossaryDefinition}>
                運転者の健康状態、車両状況等を確認し、安全な運行を確保するための制度
              </Text>
            </View>
            
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryTerm}>アルコール検知</Text>
              <Text style={styles.glossaryDefinition}>
                呼気中のアルコール濃度を測定し、飲酒運転を防止するための検査
              </Text>
            </View>
            
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryTerm}>日常点検</Text>
              <Text style={styles.glossaryDefinition}>
                車両の安全性を確保するため、運行前に実施する車両の点検
              </Text>
            </View>
            
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryTerm}>運行記録</Text>
              <Text style={styles.glossaryDefinition}>
                運行の開始・終了時刻、走行距離、経路等を記録したもの
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* チュートリアルオーバーレイ */}
      <TutorialOverlay
        visible={showTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: colors.orange,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  faqSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.charcoal,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  faqArrow: {
    fontSize: 20,
    color: colors.darkGray,
    transform: [{ rotate: '90deg' }],
  },
  faqArrowExpanded: {
    transform: [{ rotate: '270deg' }],
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.darkGray,
  },
  glossarySection: {
    marginBottom: 40,
  },
  glossaryList: {
    gap: 12,
  },
  glossaryItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 16,
    padding: 20,
  },
  glossaryTerm: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 8,
  },
  glossaryDefinition: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.darkGray,
  },
});