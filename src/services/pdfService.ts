import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TenkoRecord, UserProfile, Vehicle, NoOperationDay } from '@/types/database';
import { TenkoService } from './tenkoService';

interface PDFGenerationData {
  userProfile: UserProfile;
  records: TenkoRecord[];
  vehicles: Vehicle[];
  noOperationDays: NoOperationDay[];
  year: number;
  month: number;
}

interface WeeklyPDFData extends PDFGenerationData {
  weekLabel: string;
}

export class PDFService {
  /**
   * 指定月の点呼記録PDFを生成
   */
  static async generateMonthlyTenkoPDF(data: PDFGenerationData): Promise<string> {
    const htmlContent = this.generateHTMLContent(data);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      width: 842, // A4横向き時の幅 (297mm * 72dpi / 25.4)
      height: 595, // A4横向き時の高さ (210mm * 72dpi / 25.4)
    });
    
    return uri;
  }

  /**
   * 週単位の点呼記録PDFを生成
   */
  static async generateWeeklyTenkoPDF(data: WeeklyPDFData): Promise<string> {
    const htmlContent = this.generateHTMLContent(data);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      width: 842, // A4横向き時の幅 (297mm * 72dpi / 25.4)
      height: 595, // A4横向き時の高さ (210mm * 72dpi / 25.4)
    });
    
    return uri;
  }

  /**
   * PDFファイルを共有
   */
  static async sharePDF(uri: string, filename?: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename || '点呼記録簿',
        UTI: 'com.adobe.pdf'
      });
    } else {
      throw new Error('共有機能が利用できません');
    }
  }

  /**
   * HTMLコンテンツを生成
   */
  private static generateHTMLContent(data: PDFGenerationData): string {
    const { userProfile, records, vehicles, noOperationDays, year, month } = data;
    
    // 記録データを日付と車両でグループ化
    const recordsMap = new Map<string, Map<string, { before?: TenkoRecord; after?: TenkoRecord }>>();
    
    records.forEach(record => {
      const dateKey = record.date;
      const vehicleKey = record.vehicle_id;
      
      if (!recordsMap.has(dateKey)) {
        recordsMap.set(dateKey, new Map());
      }
      
      const dayRecords = recordsMap.get(dateKey)!;
      if (!dayRecords.has(vehicleKey)) {
        dayRecords.set(vehicleKey, {});
      }
      
      const vehicleRecords = dayRecords.get(vehicleKey)!;
      if (record.type === 'before') {
        vehicleRecords.before = record;
      } else {
        vehicleRecords.after = record;
      }
    });

    // 運行なし日をマップ化
    const noOperationMap = new Set<string>();
    noOperationDays.forEach(day => {
      noOperationMap.add(day.date);
    });

    // テーブル行を生成
    let tableRows = '';
    const maxRows = 7; // HTMLテンプレートの行数に合わせる
    
    // 車両リストを取得（最大7台）
    const vehicleList = vehicles.slice(0, maxRows);
    
    for (let i = 0; i < maxRows; i++) {
      const vehicle = vehicleList[i];
      tableRows += this.generateTableRow(vehicle, recordsMap, noOperationMap, i + 1);
    }

    // HTMLテンプレートを読み込んで置換
    const htmlTemplate = this.getHTMLTemplate();
    
    return htmlTemplate
      .replace('{{YEAR}}', year.toString())
      .replace('{{COMPANY_NAME}}', userProfile.company_name || '')
      .replace('{{DRIVER_NAME}}', userProfile.driver_name || '')
      .replace('{{TABLE_ROWS}}', tableRows);
  }

  /**
   * テーブル行を生成
   */
  private static generateTableRow(
    vehicle: Vehicle | undefined, 
    recordsMap: Map<string, Map<string, { before?: TenkoRecord; after?: TenkoRecord }>>,
    noOperationMap: Set<string>,
    rowNumber: number
  ): string {
    let vehicleNumber = vehicle?.plate_number || '';
    
    // 最後の4桁のみ取得
    if (vehicleNumber.length > 4) {
      vehicleNumber = vehicleNumber.slice(-4);
    }
    
    // 最新の記録を取得（車両が存在する場合）
    let beforeRecord: TenkoRecord | undefined;
    let afterRecord: TenkoRecord | undefined;
    let hasAnyRecord = false;
    let isNoOperationDay = false;
    
    if (vehicle) {
      // その車両の最新記録を探す
      for (const [date, dayRecords] of recordsMap) {
        const vehicleRecords = dayRecords.get(vehicle.id);
        if (vehicleRecords?.before) {
          beforeRecord = vehicleRecords.before;
          hasAnyRecord = true;
        }
        if (vehicleRecords?.after) {
          afterRecord = vehicleRecords.after;
          hasAnyRecord = true;
        }
        // 運行なし日の判定
        if (noOperationMap.has(date)) {
          isNoOperationDay = true;
        }
      }
    }

    // データがない場合（記録なし & 運行なし日でもない）の判定
    const isNoDataDay = !hasAnyRecord && !isNoOperationDay;

    return `
      <tr>
        <td class="vehicle-number" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
          ${isNoDataDay ? '運行なし' : vehicleNumber}
        </td>
        ${this.generateRecordCells(beforeRecord, 'before', isNoDataDay)}
        ${this.generateRecordCells(afterRecord, 'after', isNoDataDay)}
      </tr>
    `;
  }

  /**
   * 記録セルを生成
   */
  private static generateRecordCells(record: TenkoRecord | undefined, type: 'before' | 'after', isNoDataDay: boolean = false): string {
    if (!record) {
      // 空の記録セル
      const inspectionCell = type === 'before' 
        ? '<td class="inspection" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>' 
        : '<td class="operation" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>';
      
      // データがない日（運行なし）の場合は「対面 本人」「アルコール表示」を非表示、日付のみ表示
      if (isNoDataDay) {
        // 日付を取得（週の範囲から適切な日付を推定）
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        return `
          <td class="date-time" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
            <div class="date-input">${month}月${day}日</div>
          </td>
          <td class="method" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
          <td class="alcohol" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
          <td class="health" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
          ${inspectionCell}
          <td class="notes" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
        `;
      }
      
      return `
        <td class="date-time" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
        <td class="method" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
          <div class="fixed-value">対面</div>
          <div class="fixed-value">本人</div>
        </td>
        <td class="alcohol" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
          <div class="fixed-value">使用</div>
          <div class="fixed-value">0.00mg/L</div>
        </td>
        <td class="health" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
        ${inspectionCell}
        <td class="notes" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>
      `;
    }

    const date = new Date(record.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const time = record.created_at ? new Date(record.created_at) : new Date();
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    const healthStatus = this.getHealthStatusText(record.health_status);
    const inspectionOrOperation = type === 'before' 
      ? (record.daily_check_completed ? '実施' : '未実施')
      : this.getOperationStatusText(record.operation_status);

    const inspectionCell = type === 'before' 
      ? `<td class="inspection" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">${inspectionOrOperation}</td>` 
      : `<td class="operation" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">${inspectionOrOperation}</td>`;

    return `
      <td class="date-time" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
        <div class="date-input">${month}月${day}日</div>
        <div class="time-input">${hours}:${minutes}</div>
      </td>
      <td class="method" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
        <div class="fixed-value">対面</div>
        <div class="fixed-value">本人</div>
      </td>
      <td class="alcohol" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
        <div class="fixed-value">使用</div>
        <div class="fixed-value">${(record.alcohol_level || 0).toFixed(2)}mg/L</div>
      </td>
      <td class="health" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">${healthStatus}</td>
      ${inspectionCell}
      <td class="notes" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">${record.notes || ''}</td>
    `;
  }

  /**
   * 健康状況のテキストを取得
   */
  private static getHealthStatusText(status?: string): string {
    switch (status) {
      case 'good': return '良好';
      case 'caution': return '注意';
      case 'poor': return '不良';
      default: return '';
    }
  }

  /**
   * 運行状況のテキストを取得
   */
  private static getOperationStatusText(status?: string): string {
    switch (status) {
      case 'ok': return '正常';
      case 'ng': return '異常';
      default: return '';
    }
  }

  /**
   * HTMLテンプレートを取得
   */
  private static getHTMLTemplate(): string {
    // 実際の実装では、bundleからHTMLファイルを読み込む
    // 今はテンプレートを直接埋め込み
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>点呼記録簿</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        
        body {
            font-family: 'MS Gothic', monospace;
            font-size: 9pt;
            margin: 0 auto;
            padding: 10mm 0;
            background-color: white;
            width: 277mm; /* A4横向き(297mm) - @pageマージン(20mm) */
            height: 185mm; /* A4横向き(210mm) - @pageマージン(20mm) - 余裕(5mm) */
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .header {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 8mm;
            height: 7mm;
            line-height: 7mm;
        }
        
        .company-info {
            display: flex;
            margin-bottom: 8mm;
            margin-left: 6mm;
            gap: 15mm;
            height: 7mm;
            align-items: center;
        }
        
        .year-field {
            font-size: 14pt;
            font-weight: bold;
            padding-right: 5mm;
            margin-left: 5mm;
        }
        
        .company-field {
            display: flex;
            align-items: center;
            border: 1px solid #000;
            padding: 1mm;
            width: 80mm;
            height: 7mm;
        }
        
        .company-field label {
            background-color: #f0f0f0;
            padding: 1mm 3mm;
            border-right: 1px solid #000;
            font-weight: bold;
            width: 15mm;
            font-size: 8pt;
            text-align: center;
        }
        
        .company-field .content {
            padding: 1mm 2mm;
            flex: 1;
            font-size: 8pt;
        }
        
        .main-table {
            width: 265mm;
            border-spacing: 0;
            border: 1px solid #000 !important;
            font-size: 7pt;
            table-layout: fixed;
            margin: 0;
        }
        
        
        .main-table colgroup col:nth-child(1) { width: 21mm !important; }
        .main-table colgroup col:nth-child(2) { width: 22mm !important; }
        .main-table colgroup col:nth-child(3) { width: 14mm !important; }
        .main-table colgroup col:nth-child(4) { width: 18mm !important; }
        .main-table colgroup col:nth-child(5) { width: 14mm !important; }
        .main-table colgroup col:nth-child(6) { width: 14mm !important; }
        .main-table colgroup col:nth-child(7) { width: 40mm !important; }
        .main-table colgroup col:nth-child(8) { width: 22mm !important; }
        .main-table colgroup col:nth-child(9) { width: 14mm !important; }
        .main-table colgroup col:nth-child(10) { width: 18mm !important; }
        .main-table colgroup col:nth-child(11) { width: 14mm !important; }
        .main-table colgroup col:nth-child(12) { width: 14mm !important; }
        .main-table colgroup col:nth-child(13) { width: 40mm !important; }
        
        .main-table th,
        .main-table td {
            border: 1px solid #000 !important;
            padding: 0.5mm;
            text-align: center;
            vertical-align: middle;
            font-size: 8pt;
            line-height: 1.4;
            height: 16mm;
            overflow: hidden;
        }
        
        .main-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            height: 6mm;
        }
        
        .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
            font-size: 9pt;
            height: 8mm;
        }
        
        .vehicle-number {
            width: 21mm !important;
            min-width: 21mm !important;
            max-width: 21mm !important;
            background-color: white;
            font-size: 8pt;
        }
        
        .pre-work {
            background-color: #f8f8f8;
        }
        
        .post-work {
            background-color: #f0f0f0;
        }
        
        .fixed-value {
            font-size: 7pt;
            color: #333;
            line-height: 1.5;
        }
        
        .date-input {
            font-size: 7pt;
            line-height: 1.5;
        }
        
        .time-input {
            font-size: 7pt;
            line-height: 1.5;
        }
        
        .footer {
            margin-top: 6mm;
            font-size: 7pt;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 3mm;
            width: 265mm;
        }
        
        /* 印刷用の設定 */
        @media print {
            body {
                width: 277mm;
                height: 185mm;
                margin: 0 auto;
                padding: 10mm 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .main-table {
                width: 265mm;
                page-break-inside: avoid;
                border: 1px solid #000 !important;
            }
            
            .main-table th,
            .main-table td {
                border: 1px solid #000 !important;
            }
            
            .header, .company-info, .footer {
                page-break-inside: avoid;
            }
        }
        
        .tencore-logo {
            border: 0.5pt solid #000;
            padding: 1mm 3mm;
            font-size: 7pt;
        }
    </style>
</head>
<body>
    <div class="header">点呼記録簿</div>
    
    <div class="company-info">
        <div class="year-field">{{YEAR}}年</div>
        <div class="company-field">
            <label>屋号</label>
            <div class="content">{{COMPANY_NAME}}</div>
        </div>
        <div class="company-field">
            <label>氏名</label>
            <div class="content">{{DRIVER_NAME}}</div>
        </div>
    </div>
    
    <table class="main-table">
        <colgroup>
            <col style="width: 21mm;">
            <col style="width: 22mm;">
            <col style="width: 14mm;">
            <col style="width: 18mm;">
            <col style="width: 14mm;">
            <col style="width: 14mm;">
            <col style="width: 40mm;">
            <col style="width: 22mm;">
            <col style="width: 14mm;">
            <col style="width: 18mm;">
            <col style="width: 14mm;">
            <col style="width: 14mm;">
            <col style="width: 40mm;">
        </colgroup>
        <thead>
            <tr>
                <th rowspan="3" class="vehicle-number">車両番号</th>
                <th colspan="6" class="section-header pre-work">業務前点呼</th>
                <th colspan="6" class="section-header post-work">業務後点呼</th>
            </tr>
            <tr>
                <th class="date-time">実施日時</th>
                <th class="method">点呼方法<br />執行者</th>
                <th class="alcohol">酒気帯び<br />の有無</th>
                <th class="health">健康状況</th>
                <th class="inspection">日常点検<br />の実施</th>
                <th class="notes">特記事項</th>
                <th class="date-time">実施日時</th>
                <th class="method">点呼方法<br />執行者</th>
                <th class="alcohol">酒気帯び<br />の有無</th>
                <th class="health">健康状況</th>
                <th class="operation">運行状況</th>
                <th class="notes">特記事項</th>
            </tr>
        </thead>
        <tbody>
            {{TABLE_ROWS}}
        </tbody>
    </table>
    
    <div class="footer">
        <div class="note">注）点呼の記録は１年間保存しなければいけません。</div>
        <div class="tencore-logo">Created by delilog</div>
    </div>
</body>
</html>
    `;
  }
}