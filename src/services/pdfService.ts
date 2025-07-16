import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TenkoRecord, UserProfile, Vehicle, NoOperationDay, WorkSession, WorkSessionDetail } from '@/types/database';
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
  selectedDate?: string; // YYYY-MM-DD形式の選択された日付
}

export class PDFService {
  /**
   * 指定日が含まれる週の日付範囲を計算（日〜土）
   */
  private static getWeekDateRange(baseDate: Date): { start: Date; end: Date; dates: Date[] } {
    const start = new Date(baseDate);
    const end = new Date(baseDate);
    
    // 日曜日を週の始まりとして計算
    const dayOfWeek = start.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 週の開始日（日曜日）
    start.setDate(start.getDate() - dayOfWeek);
    
    // 週の終了日（土曜日）
    end.setDate(start.getDate() + 6);
    
    // 週の全日付を生成
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    
    return { start, end, dates };
  }

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
    const htmlContent = this.generateWeeklyHTMLContent(data);
    
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
   * 週次PDF用のHTMLコンテンツを生成
   */
  private static generateWeeklyHTMLContent(data: WeeklyPDFData): string {
    const { userProfile, records, vehicles, noOperationDays, year, month, selectedDate } = data;
    
    // 選択された日付または今日の日付を基準日として使用
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const { start, end, dates } = this.getWeekDateRange(baseDate);
    
    console.log('*** PDFService: 週次PDF生成 - 週の範囲:', {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      dates: dates.map(d => d.toISOString().split('T')[0])
    });
    
    // 業務セッションベースでグループ化
    const sessionMap = new Map<string, { before?: TenkoRecord; after?: TenkoRecord; workDate: string }>();
    
    records.forEach(record => {
      const sessionKey = record.work_session_id || `${record.date}_${record.vehicle_id}`;
      const workDate = record.work_date || record.date;
      
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, { workDate });
      }
      
      const sessionRecords = sessionMap.get(sessionKey)!;
      if (record.type === 'before') {
        sessionRecords.before = record;
      } else {
        sessionRecords.after = record;
      }
    });

    // 運行なし日をマップ化
    const noOperationMap = new Set<string>();
    noOperationDays.forEach(day => {
      noOperationMap.add(day.date);
    });

    // 週の各日付に対して車両とセッションの組み合わせを収集
    const vehicleSessionPairs: Array<{
      vehicle: Vehicle;
      sessionData: { before?: TenkoRecord; after?: TenkoRecord; sessionKey: string; sessionIndex: number };
      dateKey: string;
    }> = [];
    
    // 週の各日付について処理
    dates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      
      // 各車両について
      vehicles.forEach(vehicle => {
        const vehicleSessions: Array<{ before?: TenkoRecord; after?: TenkoRecord; sessionKey: string }> = [];
        
        // この日付のセッションを検索
        sessionMap.forEach((sessionData, sessionKey) => {
          if (sessionData.workDate === dateKey) {
            const record = sessionData.before || sessionData.after;
            if (record && record.vehicle_id === vehicle.id) {
              vehicleSessions.push({
                before: sessionData.before,
                after: sessionData.after,
                sessionKey
              });
            }
          }
        });
        
        if (vehicleSessions.length > 0) {
          // 時刻順でソート
          const sortedSessions = vehicleSessions.sort((a, b) => {
            const aTime = a.before?.created_at || a.after?.created_at || '';
            const bTime = b.before?.created_at || b.after?.created_at || '';
            return aTime.localeCompare(bTime);
          });
          
          sortedSessions.forEach((sessionData, index) => {
            vehicleSessionPairs.push({
              vehicle,
              sessionData: {
                ...sessionData,
                sessionIndex: sortedSessions.length > 1 ? index + 1 : 0
              },
              dateKey
            });
          });
        } else {
          // セッションがない場合は運行なしとして扱う
          // 明示的に運行なしと設定された日 or 記録がない日は両方とも「運行なし」として表示
          vehicleSessionPairs.push({
            vehicle,
            sessionData: { 
              sessionKey: 'no-operation', 
              sessionIndex: 0 
            },
            dateKey
          });
        }
      });
    });
    
    // 実際の業務セクション数に基づいて行数を動的に調整
    const actualSectionCount = vehicleSessionPairs.length;
    const dynamicMaxRows = Math.min(Math.max(actualSectionCount, 7), 15);
    
    console.log('*** PDFService: 週次PDF - 業務セクション数:', actualSectionCount, '動的行数:', dynamicMaxRows);
    
    // 行数に応じた行の高さを計算
    const adjustedRowHeight = this.calculateRowHeight(dynamicMaxRows);
    
    // 最大行数に収まるように調整
    const limitedPairs = vehicleSessionPairs.slice(0, dynamicMaxRows);
    
    // テーブル行を生成
    let tableRows = '';
    for (let i = 0; i < dynamicMaxRows; i++) {
      const pair = limitedPairs[i];
      tableRows += this.generateTableRowForSession(pair, noOperationMap, i + 1);
    }
    
    // 調整されたHTMLテンプレートを取得
    const htmlTemplate = this.getAdjustedHTMLTemplate(dynamicMaxRows, adjustedRowHeight);
    
    return htmlTemplate
      .replace('{{YEAR}}', year.toString())
      .replace('{{COMPANY_NAME}}', userProfile.company_name || '')
      .replace('{{DRIVER_NAME}}', userProfile.driver_name || '')
      .replace('{{TABLE_ROWS}}', tableRows);
  }

  /**
   * HTMLコンテンツを生成（業務セッション対応版）
   */
  private static generateHTMLContent(data: PDFGenerationData): string {
    const { userProfile, records, vehicles, noOperationDays, year, month } = data;
    
    // 業務セッションベースでグループ化
    const sessionMap = new Map<string, { before?: TenkoRecord; after?: TenkoRecord; workDate: string }>();
    
    records.forEach(record => {
      // work_session_idがある場合はセッションベース、ない場合は従来の日付ベース
      const sessionKey = record.work_session_id || `${record.date}_${record.vehicle_id}`;
      const workDate = record.work_date || record.date;
      
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, { workDate });
      }
      
      const sessionRecords = sessionMap.get(sessionKey)!;
      if (record.type === 'before') {
        sessionRecords.before = record;
      } else {
        sessionRecords.after = record;
      }
    });

    // セッションを日付と車両でグループ化（表示用）- 複数セッション対応
    const recordsMap = new Map<string, Map<string, Array<{ before?: TenkoRecord; after?: TenkoRecord; sessionKey: string }>>>();
    
    sessionMap.forEach((sessionData, sessionKey) => {
      const { before, after, workDate } = sessionData;
      const record = before || after;
      if (!record) return;
      
      const dateKey = workDate; // 業務基準日を使用
      const vehicleKey = record.vehicle_id;
      
      if (!recordsMap.has(dateKey)) {
        recordsMap.set(dateKey, new Map());
      }
      
      const dayRecords = recordsMap.get(dateKey)!;
      if (!dayRecords.has(vehicleKey)) {
        dayRecords.set(vehicleKey, []);
      }
      
      const vehicleRecords = dayRecords.get(vehicleKey)!;
      vehicleRecords.push({
        before,
        after,
        sessionKey
      });
    });

    // 運行なし日をマップ化
    const noOperationMap = new Set<string>();
    noOperationDays.forEach(day => {
      noOperationMap.add(day.date);
    });

    // テーブル行を生成（複数セッション対応）
    let tableRows = '';
    const maxRows = 12; // 行の高さを縮小して増やした行数
    
    // 車両・セッションの組み合わせを収集
    const vehicleSessionPairs: Array<{
      vehicle: Vehicle;
      sessionData: { before?: TenkoRecord; after?: TenkoRecord; sessionKey: string; sessionIndex: number };
      dateKey: string;
    }> = [];
    
    // 各車両について、すべてのセッションを収集
    vehicles.forEach(vehicle => {
      let hasAnySession = false;
      
      recordsMap.forEach((dayRecords, dateKey) => {
        const vehicleRecords = dayRecords.get(vehicle.id);
        if (vehicleRecords) {
          // 同日複数セッションの場合、時刻順でソート
          const sortedSessions = vehicleRecords.sort((a, b) => {
            const aTime = a.before?.created_at || a.after?.created_at || '';
            const bTime = b.before?.created_at || b.after?.created_at || '';
            return aTime.localeCompare(bTime);
          });
          
          sortedSessions.forEach((sessionData, index) => {
            vehicleSessionPairs.push({
              vehicle,
              sessionData: {
                ...sessionData,
                sessionIndex: vehicleRecords.length > 1 ? index + 1 : 0 // 複数セッションの場合のみ番号付け
              },
              dateKey
            });
            hasAnySession = true;
          });
        }
      });
      
      // 運行なし日の判定
      let hasNoOperationDay = false;
      noOperationMap.forEach(date => {
        // この車両の運行なし日があるかチェック
        if (!recordsMap.has(date) || !recordsMap.get(date)?.has(vehicle.id)) {
          hasNoOperationDay = true;
        }
      });
      
      // セッションがない車両も1行追加（運行なし表示用）
      if (!hasAnySession || hasNoOperationDay) {
        vehicleSessionPairs.push({
          vehicle,
          sessionData: { sessionKey: 'no-session', sessionIndex: 0 },
          dateKey: ''
        });
      }
    });
    
    // 実際の業務セクション数に基づいて行数を動的に調整
    const actualSectionCount = vehicleSessionPairs.length;
    const dynamicMaxRows = Math.min(Math.max(actualSectionCount, 7), 15); // 最小7行、最大15行
    
    console.log(`*** PDFService: 業務セクション数: ${actualSectionCount}, 動的行数: ${dynamicMaxRows}`);
    
    // 行数に応じた行の高さを計算
    const adjustedRowHeight = this.calculateRowHeight(dynamicMaxRows);
    
    // 最大行数に収まるように調整
    const limitedPairs = vehicleSessionPairs.slice(0, dynamicMaxRows);
    
    for (let i = 0; i < dynamicMaxRows; i++) {
      const pair = limitedPairs[i];
      tableRows += this.generateTableRowForSession(pair, noOperationMap, i + 1);
    }
    
    // 調整されたHTMLテンプレートを取得
    const htmlTemplate = this.getAdjustedHTMLTemplate(dynamicMaxRows, adjustedRowHeight);
    
    return htmlTemplate
      .replace('{{YEAR}}', year.toString())
      .replace('{{COMPANY_NAME}}', userProfile.company_name || '')
      .replace('{{DRIVER_NAME}}', userProfile.driver_name || '')
      .replace('{{TABLE_ROWS}}', tableRows);
  }

  /**
   * テーブル行を生成（セッション対応版）
   */
  private static generateTableRowForSession(
    pair: {
      vehicle: Vehicle;
      sessionData: { before?: TenkoRecord; after?: TenkoRecord; sessionKey: string; sessionIndex: number };
      dateKey: string;
    } | undefined,
    noOperationMap: Set<string>,
    rowNumber: number
  ): string {
    if (!pair) {
      // 空の行を生成
      return `
        <tr>
          <td class="vehicle-number" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
            -
          </td>
          ${this.generateRecordCells(undefined, 'before', true, undefined)}
          ${this.generateRecordCells(undefined, 'after', true, undefined)}
        </tr>
      `;
    }

    const { vehicle, sessionData, dateKey } = pair;
    let vehicleNumber = vehicle.plate_number || '';
    
    // 最後の4桁のみ取得
    if (vehicleNumber.length > 4) {
      vehicleNumber = vehicleNumber.slice(-4);
    }
    
    // 複数セッションがある場合は番号を付加
    const sessionNumber = sessionData.sessionIndex > 0 ? sessionData.sessionIndex.toString() : '';
    const displayVehicleNumber = sessionNumber ? `${vehicleNumber}(${sessionNumber})` : vehicleNumber;
    
    // 運行なし日の判定
    const isNoOperationDay = dateKey ? noOperationMap.has(dateKey) : false;
    
    // セッションデータがない場合の判定
    const isNoDataDay = (sessionData.sessionKey === 'no-session' || sessionData.sessionKey === 'no-operation') && !sessionData.before && !sessionData.after;

    // 表示用の車両番号
    let displayText = displayVehicleNumber;
    if (sessionData.sessionKey === 'no-operation') {
      displayText = '運行なし';
    }

    return `
      <tr>
        <td class="vehicle-number" style="border: 1px solid #000; padding: 0.5mm; text-align: center;">
          ${displayText}
        </td>
        ${this.generateRecordCells(sessionData.before, 'before', isNoDataDay, dateKey)}
        ${this.generateRecordCells(sessionData.after, 'after', isNoDataDay, dateKey)}
      </tr>
    `;
  }


  /**
   * 記録セルを生成
   */
  private static generateRecordCells(record: TenkoRecord | undefined, type: 'before' | 'after', isNoDataDay: boolean = false, dateKey?: string): string {
    if (!record) {
      // 空の記録セル
      const inspectionCell = type === 'before' 
        ? '<td class="inspection" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>' 
        : '<td class="operation" style="border: 1px solid #000; padding: 0.5mm; text-align: center;"></td>';
      
      // データがない日（運行なし）の場合は「対面 本人」「アルコール表示」を非表示、日付のみ表示
      if (isNoDataDay) {
        // 日付を取得（渡された日付またはtoday）
        const date = dateKey ? new Date(dateKey) : new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
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
          <div class="fixed-value">検知器使用</div>
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
        <div class="fixed-value">${record.alcohol_detector_used ? '検知器使用' : '検知器未使用'}</div>
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
   * 行数に応じた行の高さを計算（テーブル全体の高さは固定）
   */
  private static calculateRowHeight(rowCount: number): number {
    // A4横向き用紙にきれいに収まるテーブル高さ（mm）
    // A4横向き: 210mm高さ - マージン(20mm) - ヘッダー(25mm) - フッター(10mm) = 約155mm利用可能
    // テーブルヘッダー部分(14mm)を除いた本体部分の高さ
    const fixedTableHeight = 100; // 100mm
    
    // 行数に応じて高さを均等に分割
    const calculatedHeight = fixedTableHeight / rowCount;
    
    // 最小高さを7mmに制限（読みやすさのため）
    return Math.max(Math.floor(calculatedHeight), 7);
  }

  /**
   * 行数と高さに応じて調整されたHTMLテンプレートを取得
   */
  private static getAdjustedHTMLTemplate(maxRows: number, rowHeight: number): string {
    const baseTemplate = this.getHTMLTemplate();
    
    // 行の高さを調整
    const adjustedTemplate = baseTemplate.replace(
      'height: 9mm;',
      `height: ${rowHeight}mm;`
    );
    
    return adjustedTemplate;
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
            padding: 0.3mm;
            text-align: center;
            vertical-align: middle;
            font-size: 7pt;
            line-height: 1.2;
            height: 9mm;
            overflow: hidden;
        }
        
        .main-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            height: 6mm;
            font-size: 8pt;
            line-height: 1.3;
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
            font-size: 7pt;
            font-weight: bold;
        }
        
        .pre-work {
            background-color: #f8f8f8;
        }
        
        .post-work {
            background-color: #f0f0f0;
        }
        
        .fixed-value {
            font-size: 6pt;
            color: #333;
            line-height: 1.2;
        }
        
        .date-input {
            font-size: 6pt;
            line-height: 1.2;
        }
        
        .time-input {
            font-size: 6pt;
            line-height: 1.2;
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