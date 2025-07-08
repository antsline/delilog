/**
 * プライバシーポリシー画面
 * 個人情報保護方針の表示
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="戻る"
            accessibilityHint="前の画面に戻ります"
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>プライバシーポリシー</Text>
        </View>

        {/* 最終更新日 */}
        <View style={styles.updateDateCard}>
          <Text style={styles.updateDate}>最終更新日: 2025年7月8日</Text>
        </View>

        {/* プライバシーポリシー本文 */}
        <View style={styles.contentSection}>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. 個人情報の取り扱いについて</Text>
            <Text style={styles.sectionText}>
              delilog（以下「本アプリ」）は、運送事業者様の点呼記録管理を目的として開発されたアプリケーションです。本アプリは、貨物自動車運送事業法に基づく点呼記録の適切な管理と、お客様のプライバシー保護を最優先に考えています。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 収集する情報</Text>
            <Text style={styles.sectionSubtitle}>2.1 お客様が入力される情報</Text>
            <Text style={styles.sectionText}>
              • ドライバー名、所属会社名{'\n'}
              • 車両情報（ナンバープレート、車両名等）{'\n'}
              • 点呼記録（健康状態、アルコール検査結果、特記事項等）{'\n'}
              • その他、点呼業務に必要な情報
            </Text>
            
            <Text style={styles.sectionSubtitle}>2.2 自動的に収集される情報</Text>
            <Text style={styles.sectionText}>
              • アプリの使用状況（エラーログ、パフォーマンス情報）{'\n'}
              • 端末情報（OS、バージョン、機種等）{'\n'}
              • ネットワーク接続状況
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. 情報の利用目的</Text>
            <Text style={styles.sectionText}>
              収集した情報は以下の目的でのみ利用します：{'\n\n'}
              • 貨物自動車運送事業法に基づく点呼記録の作成・管理{'\n'}
              • アプリの機能向上・バグ修正{'\n'}
              • カスタマーサポートの提供{'\n'}
              • 法令に基づく対応
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. 情報の共有・第三者提供</Text>
            <Text style={styles.sectionText}>
              お客様の個人情報は、以下の場合を除き第三者に提供いたしません：{'\n\n'}
              • お客様の同意がある場合{'\n'}
              • 法令に基づく開示要求がある場合{'\n'}
              • 人の生命、身体または財産の保護のために必要な場合
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. データの保存・セキュリティ</Text>
            <Text style={styles.sectionText}>
              • データは暗号化して安全に保存されます{'\n'}
              • サーバーは日本国内に設置され、適切なセキュリティ対策を実施{'\n'}
              • 生体認証等の最新セキュリティ技術を活用{'\n'}
              • 定期的なセキュリティ監査を実施
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. お客様の権利</Text>
            <Text style={styles.sectionText}>
              お客様は、ご自身の個人情報について以下の権利を有します：{'\n\n'}
              • 情報の確認・修正・削除を要求する権利{'\n'}
              • データの利用停止を要求する権利{'\n'}
              • データのエクスポート（可搬性）を要求する権利{'\n'}
              • 同意の撤回を行う権利
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. データの保存期間</Text>
            <Text style={styles.sectionText}>
              • 点呼記録：貨物自動車運送事業法に基づき1年間保存{'\n'}
              • その他のデータ：サービス提供に必要な期間{'\n'}
              • アカウント削除時：すべてのデータを完全削除
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Cookie・トラッキング</Text>
            <Text style={styles.sectionText}>
              本アプリは、お客様のプライバシーを尊重し、以下のポリシーを採用しています：{'\n\n'}
              • 広告配信のためのトラッキングは行いません{'\n'}
              • 分析目的での個人特定可能な情報の収集は行いません{'\n'}
              • 必要最小限の技術的情報のみを収集
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. 未成年者の情報</Text>
            <Text style={styles.sectionText}>
              本アプリは、18歳未満の方の個人情報を故意に収集することはありません。万一、未成年者の情報が収集されたことが判明した場合は、速やかに削除いたします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. 国際データ転送</Text>
            <Text style={styles.sectionText}>
              お客様の個人情報は、原則として日本国内で処理・保存されます。海外への転送が必要な場合は、適切な保護措置を講じた上で実施いたします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. プライバシーポリシーの変更</Text>
            <Text style={styles.sectionText}>
              本プライバシーポリシーは、法令の変更やサービスの改善に伴い更新される場合があります。重要な変更がある場合は、アプリ内通知等でお知らせいたします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. お問い合わせ</Text>
            <Text style={styles.sectionText}>
              個人情報の取り扱いに関するご質問・ご要望は、アプリ内のサポート機能またはメールにてお問い合わせください。{'\n\n'}
              対応時間：平日 9:00-17:00{'\n'}
              (土日祝日、年末年始を除く)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. 準拠法・管轄裁判所</Text>
            <Text style={styles.sectionText}>
              本プライバシーポリシーは日本法に準拠し、本ポリシーに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </Text>
          </View>

        </View>

        {/* 同意・確認セクション */}
        <View style={styles.agreementSection}>
          <Text style={styles.agreementTitle}>個人情報の取り扱いについて</Text>
          <Text style={styles.agreementText}>
            本アプリのご利用により、上記プライバシーポリシーにご同意いただいたものとみなします。ご不明な点がございましたら、お気軽にお問い合わせください。
          </Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
  },
  backIconText: {
    fontSize: 24,
    color: colors.charcoal,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  updateDateCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  updateDate: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '600',
  },
  contentSection: {
    backgroundColor: colors.cream,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.darkGray,
  },
  agreementSection: {
    backgroundColor: colors.lightOrange || colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  agreementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 8,
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.darkGray,
  },
});