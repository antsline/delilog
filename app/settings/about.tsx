import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>アプリについて</Text>
        </View>
        
        <View style={styles.content}>
          {/* アプリ情報セクション */}
          <View style={styles.section}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>delilog</Text>
              <Text style={styles.appSubtitle}>運送業点呼記録アプリ</Text>
              <Text style={styles.version}>バージョン 1.0.0</Text>
            </View>
          </View>

          {/* アプリの説明セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アプリについて</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                delilogは運送業者向けの点呼記録アプリです。国土交通省の運送業法に基づく点呼記録を簡単に作成・管理し、PDF形式での記録簿出力が可能です。
              </Text>
            </View>
          </View>

          {/* 主な機能セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>主な機能</Text>
            <View style={styles.card}>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>業務前・業務後点呼記録</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>アルコール検知記録</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>健康状態・日常点検確認</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>PDF記録簿の自動生成</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>月別記録一覧・検索</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>複数車両管理</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 法的要件セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>法的要件への対応</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                本アプリは貨物自動車運送事業法および関連省令に基づく点呼記録の要件を満たすよう設計されています。生成されるPDF記録簿は法定の記録項目をすべて含んでおり、監査等での提出書類として使用可能です。
              </Text>
            </View>
          </View>

          {/* サポート情報セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サポート</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                ご質問やサポートが必要な場合は、設定画面の「お問い合わせ」からご連絡ください。
              </Text>
            </View>
          </View>

          {/* 免責事項セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>免責事項</Text>
            <View style={styles.card}>
              <Text style={styles.disclaimerText}>
                本アプリの使用に関して生じたいかなる損害についても、開発者は責任を負いません。法的要件については最新の法令を確認し、必要に応じて専門家にご相談ください。
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
    marginBottom: 20,
  },
  backIcon: {
    marginRight: 12,
    padding: 8,
  },
  backIconText: {
    fontSize: 24,
    color: colors.charcoal,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  section: {
    marginBottom: 24,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    color: colors.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: colors.darkGray,
    backgroundColor: colors.beige,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 16,
    color: colors.orange,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 16,
    color: colors.charcoal,
    flex: 1,
    lineHeight: 22,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});