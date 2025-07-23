/**
 * 解約時データエクスポートサービス
 * 法令遵守のため、全データを利用者に提供
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import { TenkoService } from '@/services/tenkoService';
import { VehicleService } from '@/services/vehicleService';

interface DataExportServiceProps {
  visible: boolean;
  onClose: () => void;
  onExportComplete?: () => void;
}

export default function DataExportService({
  visible,
  onClose,
  onExportComplete,
}: DataExportServiceProps) {
  const { user, profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleExportData = async () => {
    if (!user || !profile) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress('データを準備中...');

      // 1. 全ての点呼記録を取得
      setExportProgress('点呼記録を取得中...');
      const allTenkoRecords = await TenkoService.getAllUserRecords(user.id);

      // 2. 車両データを取得
      setExportProgress('車両データを取得中...');
      const vehicles = await VehicleService.getUserVehicles(user.id);

      // 3. ユーザー設定を取得
      setExportProgress('設定情報を取得中...');
      const userSettings = {
        profile,
        exportDate: new Date().toISOString(),
        totalRecords: allTenkoRecords.length,
        totalVehicles: vehicles.length,
      };

      // 4. CSVファイルを生成
      setExportProgress('CSVファイルを生成中...');
      const csvContent = generateTenkoCSV(allTenkoRecords);
      
      // 5. README.txtを生成
      const readmeContent = generateReadmeFile(userSettings);

      // 6. ファイルを保存
      setExportProgress('ファイルを保存中...');
      const csvUri = `${FileSystem.documentDirectory}delilog_tenko_records.csv`;
      const vehiclesCsvUri = `${FileSystem.documentDirectory}delilog_vehicles.csv`;
      const readmeUri = `${FileSystem.documentDirectory}delilog_readme.txt`;
      const settingsUri = `${FileSystem.documentDirectory}delilog_settings.json`;

      await FileSystem.writeAsStringAsync(csvUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await FileSystem.writeAsStringAsync(vehiclesCsvUri, generateVehiclesCSV(vehicles), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await FileSystem.writeAsStringAsync(readmeUri, readmeContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await FileSystem.writeAsStringAsync(settingsUri, JSON.stringify(userSettings, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setExportProgress('エクスポート完了');

      // 7. 共有
      Alert.alert(
        'エクスポート完了',
        `${allTenkoRecords.length}件の記録をエクスポートしました。\n\nファイルを共有してデータを保存してください。`,
        [
          {
            text: 'ファイルを共有',
            onPress: async () => {
              await Sharing.shareAsync(csvUri);
              if (onExportComplete) {
                onExportComplete();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Data export error:', error);
      Alert.alert(
        'エクスポートエラー',
        'データのエクスポート中にエラーが発生しました。'
      );
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const generateTenkoCSV = (records: any[]): string => {
    const headers = [
      '日付',
      '種別',
      '車両ID',
      '車両番号',
      '点呼方法',
      '実施者',
      'アルコール濃度',
      'アルコール検知器使用',
      'アルコール検知',
      '健康状態',
      '日常点検完了',
      '備考',
      '作成日時',
      '更新日時',
    ];

    const csvRows = [headers.join(',')];

    records.forEach((record) => {
      const row = [
        record.date,
        record.type,
        record.vehicle_id,
        record.vehicle?.license_plate || '',
        record.check_method,
        record.executor,
        record.alcohol_level,
        record.alcohol_detector_used ? 'はい' : 'いいえ',
        record.alcohol_detected ? 'はい' : 'いいえ',
        record.health_status,
        record.daily_check_completed ? 'はい' : 'いいえ',
        `"${record.notes || ''}"`,
        record.created_at,
        record.updated_at,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const generateVehiclesCSV = (vehicles: any[]): string => {
    const headers = [
      '車両ID',
      'ナンバープレート',
      '車種',
      'メーカー',
      'モデル',
      '年式',
      '最大積載量',
      '車両重量',
      'デフォルト車両',
      'アクティブ',
      '作成日時',
    ];

    const csvRows = [headers.join(',')];

    vehicles.forEach((vehicle) => {
      const row = [
        vehicle.id,
        vehicle.license_plate,
        vehicle.vehicle_type,
        vehicle.manufacturer || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.max_load_weight || '',
        vehicle.vehicle_weight || '',
        vehicle.is_default ? 'はい' : 'いいえ',
        vehicle.is_active ? 'はい' : 'いいえ',
        vehicle.created_at,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const generateReadmeFile = (settings: any): string => {
    return `# デリログ データエクスポート

このファイルには、デリログアプリからエクスポートされたあなたのデータが含まれています。

## エクスポート情報
- エクスポート日時: ${new Date(settings.exportDate).toLocaleString('ja-JP')}
- 点呼記録数: ${settings.totalRecords}件
- 車両数: ${settings.totalVehicles}台

## ファイル一覧

### delilog_tenko_records.csv
あなたの全ての点呼記録が含まれています。
- 点呼前・点呼後の記録
- 日付、車両、健康状態、アルコール検査結果など
- Excel等の表計算ソフトで開けます

### delilog_vehicles.csv  
登録された車両情報が含まれています。
- ナンバープレート、車種、メーカーなど
- Excel等の表計算ソフトで開けます

### delilog_settings.json
アカウント設定とメタデータが含まれています。
- ユーザープロフィール情報
- エクスポート時の統計情報

### delilog_readme.txt (このファイル)
データの説明とご利用方法です。

## データの取り扱いについて

- このデータは法令に基づく記録保管のためにエクスポートされました
- データは適切に管理し、必要な期間保管してください  
- 機密情報が含まれる場合があります。取り扱いには十分注意してください

## 技術的な注意事項

- CSVファイルはUTF-8エンコーディングです
- Excel等で開く際、文字化けする場合は「データ」>「テキストファイル」から読み込んでください
- 日付形式: YYYY-MM-DD
- 時刻形式: ISO 8601 (YYYY-MM-DDTHH:MM:SS.sssZ)

## サポート

データに関するお問い合わせは、delilogサポートまでご連絡ください。

---
デリログ v1.0
エクスポート機能 by Claude Code
`;
  };

  const renderConfirmationModal = () => (
    <Modal
      visible={showConfirmation}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationContent}>
          <View style={styles.confirmationHeader}>
            <Ionicons name="warning" size={32} color={colors.warning} />
            <Text style={styles.confirmationTitle}>
              解約とデータエクスポート
            </Text>
          </View>

          <ScrollView style={styles.confirmationBody}>
            <Text style={styles.confirmationText}>
              解約手続きを開始します。以下の点をご確認ください：
            </Text>

            <View style={styles.confirmationPoints}>
              <View style={styles.confirmationPoint}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.confirmationPointText}>
                  全てのデータをエクスポートして提供します
                </Text>
              </View>
              <View style={styles.confirmationPoint}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.confirmationPointText}>
                  法令遵守のため1年間記録を保管できます
                </Text>
              </View>
              <View style={styles.confirmationPoint}>
                <Ionicons name="alert-circle" size={16} color={colors.warning} />
                <Text style={styles.confirmationPointText}>
                  解約後はアプリでの記録管理ができなくなります
                </Text>
              </View>
              <View style={styles.confirmationPoint}>
                <Ionicons name="alert-circle" size={16} color={colors.warning} />
                <Text style={styles.confirmationPointText}>
                  今後の記録は手動で管理していただく必要があります
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.confirmationActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowConfirmation(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                setShowConfirmation(false);
                handleExportData();
              }}
            >
              <Text style={styles.confirmButtonText}>
                データをエクスポートして解約
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>データエクスポート</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isExporting}
            >
              <Ionicons name="close" size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          {isExporting ? (
            <View style={styles.exportingContainer}>
              <ActivityIndicator size="large" color={colors.orange} />
              <Text style={styles.exportingText}>{exportProgress}</Text>
              <Text style={styles.exportingSubtext}>
                しばらくお待ちください...
              </Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.infoContainer}>
                <Ionicons name="download" size={32} color={colors.blue} />
                <Text style={styles.infoTitle}>
                  全てのデータを安全にエクスポート
                </Text>
                <Text style={styles.infoDescription}>
                  法令遵守のため、あなたの全ての記録データを提供いたします。
                </Text>
              </View>

              <View style={styles.exportItems}>
                <View style={styles.exportItem}>
                  <Ionicons name="document-text" size={20} color={colors.success} />
                  <Text style={styles.exportItemText}>全ての点呼記録 (CSV形式)</Text>
                </View>
                <View style={styles.exportItem}>
                  <Ionicons name="car" size={20} color={colors.success} />
                  <Text style={styles.exportItemText}>車両データ (CSV形式)</Text>
                </View>
                <View style={styles.exportItem}>
                  <Ionicons name="settings" size={20} color={colors.success} />
                  <Text style={styles.exportItemText}>設定情報 (JSON形式)</Text>
                </View>
                <View style={styles.exportItem}>
                  <Ionicons name="information-circle" size={20} color={colors.success} />
                  <Text style={styles.exportItemText}>データ説明書 (TXT形式)</Text>
                </View>
              </View>

              <View style={styles.noteContainer}>
                <Text style={styles.noteTitle}>📋 エクスポート後の管理について</Text>
                <Text style={styles.noteText}>
                  • データは適切に保管し、法定期間（1年間）保存してください{'\n'}
                  • Excel等の表計算ソフトで記録を確認できます{'\n'}
                  • 今後の点呼記録は手動で管理していただく必要があります
                </Text>
              </View>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => setShowConfirmation(true)}
              >
                <Ionicons name="download" size={20} color={colors.cream} />
                <Text style={styles.exportButtonText}>
                  全データをエクスポートして解約
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {renderConfirmationModal()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  exportingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  exportingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: 16,
  },
  exportingSubtext: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  exportItems: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '500',
  },
  noteContainer: {
    backgroundColor: colors.blue + '10',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
  },
  exportButtonText: {
    marginLeft: 8,
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  confirmationHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 8,
  },
  confirmationBody: {
    maxHeight: 300,
    padding: 20,
  },
  confirmationText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 16,
  },
  confirmationPoints: {
    gap: 12,
  },
  confirmationPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmationPointText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 18,
  },
  confirmationActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.beige,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
});