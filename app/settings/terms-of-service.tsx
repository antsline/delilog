/**
 * 利用規約画面
 * サービス利用規約の表示
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

export default function TermsOfServiceScreen() {
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
          <Text style={styles.title}>利用規約</Text>
        </View>

        {/* 最終更新日 */}
        <View style={styles.updateDateCard}>
          <Text style={styles.updateDate}>最終更新日: 2025年7月8日</Text>
        </View>

        {/* 利用規約本文 */}
        <View style={styles.contentSection}>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第1条（適用）</Text>
            <Text style={styles.sectionText}>
              本利用規約（以下「本規約」）は、delilog（以下「本サービス」）の利用条件を定めるものです。運送事業者様（以下「ユーザー」）は、本規約に同意した上で本サービスをご利用ください。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第2条（利用登録）</Text>
            <Text style={styles.sectionText}>
              1. 本サービスの利用には、所定の方法による利用登録が必要です。{'\n'}
              2. 利用登録は、運送事業の適正な実施を目的とする事業者に限定されます。{'\n'}
              3. 以下に該当する場合、利用登録をお断りする場合があります：{'\n'}
              　• 提供情報に虚偽の記載がある場合{'\n'}
              　• 運送業以外の目的での利用が明らかな場合{'\n'}
              　• その他、当社が不適切と判断した場合
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第3条（サービス内容）</Text>
            <Text style={styles.sectionText}>
              本サービスは、貨物自動車運送事業法に基づく点呼記録の作成・管理機能を提供します。{'\n\n'}
              主な機能：{'\n'}
              • 業務前・業務後点呼記録の作成{'\n'}
              • アルコール検査結果の記録{'\n'}
              • 車両・ドライバー情報の管理{'\n'}
              • 点呼記録簿のPDF出力{'\n'}
              • データのバックアップ・同期
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第4条（利用料金）</Text>
            <Text style={styles.sectionText}>
              1. 本サービスの基本機能は無料で提供いたします。{'\n'}
              2. 将来的に有料プランを導入する場合は、事前に通知いたします。{'\n'}
              3. 有料機能をご利用の場合、所定の料金をお支払いいただきます。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第5条（禁止事項）</Text>
            <Text style={styles.sectionText}>
              ユーザーは以下の行為を行ってはなりません：{'\n\n'}
              • 法令に違反する行為{'\n'}
              • 虚偽の点呼記録を作成する行為{'\n'}
              • 他者のアカウントを不正使用する行為{'\n'}
              • 本サービスの運営を妨害する行為{'\n'}
              • リバースエンジニアリング等の解析行為{'\n'}
              • 営利目的での再販・転用行為{'\n'}
              • その他、当社が不適切と判断する行為
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第6条（知的財産権）</Text>
            <Text style={styles.sectionText}>
              1. 本サービスに関する知的財産権は、当社に帰属します。{'\n'}
              2. ユーザーが入力したデータの著作権は、ユーザーに帰属します。{'\n'}
              3. ユーザーは、サービス提供に必要な範囲で、データの利用を当社に許諾するものとします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第7条（サービスの変更・停止）</Text>
            <Text style={styles.sectionText}>
              1. 当社は、ユーザーに事前に通知することで、本サービスの内容を変更できます。{'\n'}
              2. 以下の場合、事前通知なくサービスを停止することがあります：{'\n'}
              　• システムメンテナンスの場合{'\n'}
              　• 障害・災害等の緊急時{'\n'}
              　• その他、やむを得ない事情がある場合
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第8条（データの取り扱い）</Text>
            <Text style={styles.sectionText}>
              1. ユーザーデータは、貨物自動車運送事業法の要件に従い適切に管理します。{'\n'}
              2. データのバックアップは定期的に実施いたします。{'\n'}
              3. サービス終了時は、法定保存期間経過後にデータを削除いたします。{'\n'}
              4. 詳細な取り扱いについては、別途プライバシーポリシーをご確認ください。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第9条（免責事項）</Text>
            <Text style={styles.sectionText}>
              1. 本サービスは現状有姿で提供され、完全性・正確性等を保証するものではありません。{'\n'}
              2. 以下について、当社は一切の責任を負いません：{'\n'}
              　• ユーザーの操作ミスによる損害{'\n'}
              　• 第三者による不正アクセス{'\n'}
              　• 通信障害・システム障害による損害{'\n'}
              　• 法令変更による影響{'\n'}
              3. ただし、当社の故意・重過失による場合はこの限りではありません。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第10条（損害賠償）</Text>
            <Text style={styles.sectionText}>
              1. 当社の責任は、直接損害に限定され、間接損害・逸失利益等については責任を負いません。{'\n'}
              2. 損害賠償の上限は、損害発生前1年間にユーザーが支払った利用料金相当額とします。{'\n'}
              3. 無料プランご利用の場合、損害賠償責任は負わないものとします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第11条（利用停止・アカウント削除）</Text>
            <Text style={styles.sectionText}>
              以下の場合、事前通知なく利用停止・アカウント削除を行うことがあります：{'\n\n'}
              • 本規約違反があった場合{'\n'}
              • 利用料金の滞納がある場合{'\n'}
              • 長期間の利用停止状態が続く場合{'\n'}
              • その他、当社が不適切と判断した場合
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第12条（秘密保持）</Text>
            <Text style={styles.sectionText}>
              1. 当社は、本サービス提供により知り得たユーザーの情報を秘密として保持します。{'\n'}
              2. 法令に基づく開示要求がある場合はこの限りではありません。{'\n'}
              3. 秘密保持義務は、サービス終了後も継続するものとします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第13条（規約の変更）</Text>
            <Text style={styles.sectionText}>
              1. 当社は、法令変更・サービス改善等の理由により本規約を変更することがあります。{'\n'}
              2. 重要な変更については、アプリ内通知等により事前にお知らせします。{'\n'}
              3. 変更後も継続してサービスをご利用いただいた場合、変更に同意したものとみなします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第14条（準拠法・管轄裁判所）</Text>
            <Text style={styles.sectionText}>
              1. 本規約は日本法に準拠します。{'\n'}
              2. 本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>第15条（お問い合わせ）</Text>
            <Text style={styles.sectionText}>
              本規約に関するご質問・ご要望は、アプリ内のサポート機能またはメールにてお問い合わせください。{'\n\n'}
              対応時間：平日 9:00-17:00{'\n'}
              (土日祝日、年末年始を除く)
            </Text>
          </View>

        </View>

        {/* 同意・確認セクション */}
        <View style={styles.agreementSection}>
          <Text style={styles.agreementTitle}>利用規約への同意</Text>
          <Text style={styles.agreementText}>
            本サービスのご利用により、上記利用規約にご同意いただいたものとみなします。規約内容をよくお読みいただき、ご不明な点がございましたらお問い合わせください。
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