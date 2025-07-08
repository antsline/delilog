/**
 * データエクスポートサービス
 * CSV、PDF形式でのデータ書き出し機能
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { TenkoService } from './tenkoService';
import { VehicleService } from './vehicleService';
import { useAuthStore } from '@/store/authStore';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange: {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  };
  includeVehicleInfo: boolean;
  includePersonalInfo: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
}

class DataExportService {
  /**
   * データをエクスポート
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('📤 データエクスポート開始:', options);
      
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // データを取得
      const data = await this.fetchExportData(user.id, options);
      
      if (data.records.length === 0) {
        return {
          success: false,
          error: '指定期間にエクスポート可能なデータがありません',
        };
      }

      // 形式に応じてエクスポート
      if (options.format === 'csv') {
        return await this.exportAsCSV(data, options);
      } else {
        return await this.exportAsPDF(data, options);
      }
    } catch (error) {
      console.error('❌ データエクスポートエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'エクスポートに失敗しました',
      };
    }
  }

  /**
   * エクスポート用データの取得
   */
  private async fetchExportData(userId: string, options: ExportOptions) {
    const startDate = new Date(options.dateRange.startDate);
    const endDate = new Date(options.dateRange.endDate);
    
    console.log(`📊 データ取得: ${startDate.toISOString()} ～ ${endDate.toISOString()}`);
    
    // 期間内の記録を取得
    const records = await TenkoService.getRecordsByDateRange(
      userId,
      options.dateRange.startDate,
      options.dateRange.endDate
    );
    
    // 車両情報を取得（必要な場合）
    let vehicles = [];
    if (options.includeVehicleInfo) {
      vehicles = await VehicleService.getUserVehicles(userId);
    }
    
    return {
      records,
      vehicles,
      exportDate: new Date().toISOString(),
      dateRange: options.dateRange,
    };
  }

  /**
   * CSV形式でエクスポート
   */
  private async exportAsCSV(data: any, options: ExportOptions): Promise<ExportResult> {
    try {
      // CSVヘッダー
      const headers = [
        '日付',
        '種別',
        '車両番号',
        '点呼方法',
        '実施者',
        'アルコール数値',
        '健康状態',
        '日常点検',
        '運行状況',
        '特記事項',
        '作成日時',
      ];
      
      // 車両情報を含める場合
      if (options.includeVehicleInfo) {
        headers.push('車両名');
      }
      
      // CSVデータ生成
      const csvRows = [headers.join(',')];
      
      for (const record of data.records) {
        // 車両情報を取得
        const vehicle = data.vehicles.find((v: any) => v.id === record.vehicle_id);
        
        const row = [
          record.date,
          record.type === 'before' ? '業務前' : '業務後',
          vehicle?.plate_number || '',
          record.check_method,
          record.executor,
          record.alcohol_level.toString(),
          this.getHealthStatusText(record.health_status),
          record.daily_check_completed ? '実施' : '未実施',
          this.getOperationStatusText(record.operation_status),
          record.notes || '',
          new Date(record.created_at).toLocaleString(),
        ];
        
        if (options.includeVehicleInfo) {
          row.push(vehicle?.vehicle_name || '');
        }
        
        // CSVエスケープ処理
        const escapedRow = row.map(field => {
          const fieldStr = String(field);
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        });
        
        csvRows.push(escapedRow.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      // ファイル保存
      const fileName = `delilog_export_${data.dateRange.startDate}_${data.dateRange.endDate}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // BOM付きUTF-8で保存（Excel対応）
      const bom = '\uFEFF';
      await FileSystem.writeAsStringAsync(filePath, bom + csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // ファイルサイズ取得
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      console.log('✅ CSV生成完了:', fileName);
      
      return {
        success: true,
        filePath,
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('❌ CSV生成エラー:', error);
      throw error;
    }
  }

  /**
   * PDF形式でエクスポート
   */
  private async exportAsPDF(data: any, options: ExportOptions): Promise<ExportResult> {
    try {
      // HTMLテンプレート生成
      const html = this.generatePDFTemplate(data, options);
      
      // PDF生成
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      // ファイル名変更
      const fileName = `delilog_export_${data.dateRange.startDate}_${data.dateRange.endDate}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });
      
      // ファイルサイズ取得
      const fileInfo = await FileSystem.getInfoAsync(newPath);
      
      console.log('✅ PDF生成完了:', fileName);
      
      return {
        success: true,
        filePath: newPath,
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      console.error('❌ PDF生成エラー:', error);
      throw error;
    }
  }

  /**
   * PDF用HTMLテンプレート生成
   */
  private generatePDFTemplate(data: any, options: ExportOptions): string {
    const { records, vehicles, dateRange } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>点呼記録エクスポート</title>
        <style>
            body {
                font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                margin: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
            }
            .title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .date-range {
                font-size: 14px;
                color: #666;
            }
            .export-info {
                text-align: right;
                margin-bottom: 20px;
                font-size: 10px;
                color: #666;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #333;
                padding: 8px;
                text-align: left;
                font-size: 10px;
            }
            th {
                background-color: #f5f5f5;
                font-weight: bold;
                text-align: center;
            }
            .center {
                text-align: center;
            }
            .before-work {
                background-color: #e8f5e8;
            }
            .after-work {
                background-color: #e8e8f5;
            }
            .page-break {
                page-break-before: always;
            }
            .summary {
                margin-top: 30px;
                padding: 15px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">点呼記録エクスポート</div>
            <div class="date-range">期間: ${dateRange.startDate} ～ ${dateRange.endDate}</div>
        </div>
        
        <div class="export-info">
            エクスポート日時: ${new Date().toLocaleString()}<br>
            記録件数: ${records.length}件
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>日付</th>
                    <th>種別</th>
                    <th>車両番号</th>
                    <th>点呼方法</th>
                    <th>実施者</th>
                    <th>アルコール数値</th>
                    <th>健康状態</th>
                    <th>日常点検</th>
                    <th>運行状況</th>
                    <th>特記事項</th>
                    ${options.includeVehicleInfo ? '<th>車両名</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${records.map((record: any) => {
                  const vehicle = vehicles.find((v: any) => v.id === record.vehicle_id);
                  const rowClass = record.type === 'before' ? 'before-work' : 'after-work';
                  
                  return `
                    <tr class="${rowClass}">
                        <td class="center">${record.date}</td>
                        <td class="center">${record.type === 'before' ? '業務前' : '業務後'}</td>
                        <td class="center">${vehicle?.plate_number || ''}</td>
                        <td class="center">${record.check_method}</td>
                        <td class="center">${record.executor}</td>
                        <td class="center">${record.alcohol_level}</td>
                        <td class="center">${this.getHealthStatusText(record.health_status)}</td>
                        <td class="center">${record.daily_check_completed ? '実施' : '未実施'}</td>
                        <td class="center">${this.getOperationStatusText(record.operation_status)}</td>
                        <td>${record.notes || ''}</td>
                        ${options.includeVehicleInfo ? `<td>${vehicle?.vehicle_name || ''}</td>` : ''}
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="summary">
            <strong>集計情報</strong><br>
            業務前点呼: ${records.filter((r: any) => r.type === 'before').length}件<br>
            業務後点呼: ${records.filter((r: any) => r.type === 'after').length}件<br>
            アルコール検知件数: ${records.filter((r: any) => parseFloat(r.alcohol_level) > 0).length}件
        </div>
        
        <div style="margin-top: 30px; font-size: 10px; color: #666; text-align: center;">
            このデータは delilog アプリケーションから出力されました。<br>
            貨物自動車運送事業法に基づく点呼記録として保管してください。
        </div>
    </body>
    </html>
    `;
  }

  /**
   * ファイルを共有
   */
  async shareExportedFile(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('ファイル共有機能が利用できません');
      }
      
      await Sharing.shareAsync(filePath, {
        mimeType: filePath.endsWith('.csv') ? 'text/csv' : 'application/pdf',
        dialogTitle: 'エクスポートファイルを共有',
      });
      
      console.log('📤 ファイル共有完了');
      return true;
    } catch (error) {
      console.error('❌ ファイル共有エラー:', error);
      return false;
    }
  }

  /**
   * エクスポートファイルを削除
   */
  async deleteExportedFile(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log('🗑️ エクスポートファイル削除完了');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ ファイル削除エラー:', error);
      return false;
    }
  }

  /**
   * 健康状態のテキスト変換
   */
  private getHealthStatusText(status: string): string {
    switch (status) {
      case 'good': return '良好';
      case 'caution': return '注意';
      case 'poor': return '不良';
      default: return status;
    }
  }

  /**
   * 運行状況のテキスト変換
   */
  private getOperationStatusText(status: string): string {
    switch (status) {
      case 'ok': return '正常';
      case 'caution': return '注意';
      case 'cancelled': return '中止';
      default: return status;
    }
  }

  /**
   * エクスポート可能な最大期間（日数）
   */
  getMaxExportDays(): number {
    return 365; // 1年間
  }

  /**
   * 推奨エクスポート形式の取得
   */
  getRecommendedFormat(recordCount: number): 'csv' | 'pdf' {
    // 大量データの場合はCSVを推奨
    return recordCount > 100 ? 'csv' : 'pdf';
  }
}

// シングルトンインスタンス
export const dataExportService = new DataExportService();