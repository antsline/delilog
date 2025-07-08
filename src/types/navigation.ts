export interface PDFExportParams {
  year?: number;
  month?: number;
  day?: number;
  type?: 'tenko' | 'daily-check' | 'operation-record';
}

export interface RecordDateSelection {
  year: number;
  month: number;
  day: number;
}