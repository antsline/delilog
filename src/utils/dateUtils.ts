/**
 * 日本時間専用の日付処理ユーティリティ
 * このアプリは日本のみで利用されるため、すべて日本時間（JST, UTC+9）で統一
 */

/**
 * 現在の日本時間を取得
 */
export const getJapanDate = (): Date => {
  const now = new Date();
  // 日本時間に変換（UTC+9）
  const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return japanTime;
};

/**
 * 今日の日付を日本時間でYYYY-MM-DD形式で取得
 */
export const getTodayJapanDateString = (): string => {
  const japanDate = getJapanDate();
  return formatDateToYYYYMMDD(japanDate);
};

/**
 * 日付をYYYY-MM-DD形式の文字列に変換（日本時間基準）
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const japanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  const year = japanTime.getUTCFullYear();
  const month = String(japanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(japanTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 日本時間での現在時刻をISO文字列で取得
 */
export const getJapanISOString = (): string => {
  const japanDate = getJapanDate();
  return japanDate.toISOString();
};

/**
 * 指定した日付の日本時間での開始時刻を取得（00:00:00）
 */
export const getJapanDayStart = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // 日本時間での日付開始時刻を作成
  const japanDate = new Date();
  japanDate.setUTCFullYear(year, month - 1, day);
  japanDate.setUTCHours(0, 0, 0, 0);
  // UTC-9時間を引いて日本時間の00:00を表現
  return new Date(japanDate.getTime() - (9 * 60 * 60 * 1000));
};

/**
 * 指定した日付の日本時間での終了時刻を取得（23:59:59.999）
 */
export const getJapanDayEnd = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // 日本時間での日付終了時刻を作成
  const japanDate = new Date();
  japanDate.setUTCFullYear(year, month - 1, day);
  japanDate.setUTCHours(23, 59, 59, 999);
  // UTC-9時間を引いて日本時間の23:59を表現
  return new Date(japanDate.getTime() - (9 * 60 * 60 * 1000));
};

/**
 * 日付文字列（YYYY-MM-DD）を日本時間のDateオブジェクトに変換
 */
export const parseJapanDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // 日本時間として解釈
  const japanDate = new Date();
  japanDate.setUTCFullYear(year, month - 1, day);
  japanDate.setUTCHours(12, 0, 0, 0); // 日本時間の正午として設定
  return new Date(japanDate.getTime() - (9 * 60 * 60 * 1000));
};

/**
 * 2つの日付の差を日数で取得（日本時間基準）
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const date1Japan = formatDateToYYYYMMDD(date1);
  const date2Japan = formatDateToYYYYMMDD(date2);
  
  const time1 = parseJapanDateString(date1Japan).getTime();
  const time2 = parseJapanDateString(date2Japan).getTime();
  
  const diffTime = Math.abs(time1 - time2);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 指定した日数前の日付を日本時間で取得
 */
export const getDaysAgo = (days: number): string => {
  const today = getJapanDate();
  const pastDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
  return formatDateToYYYYMMDD(pastDate);
};

/**
 * 指定した月数前の日付を日本時間で取得
 */
export const getMonthsAgo = (months: number): string => {
  const today = getJapanDate();
  const pastDate = new Date(today.getTime());
  pastDate.setUTCMonth(pastDate.getUTCMonth() - months);
  return formatDateToYYYYMMDD(pastDate);
};

/**
 * 日付が今日（日本時間）かどうかをチェック
 */
export const isToday = (date: Date | string): boolean => {
  const todayString = getTodayJapanDateString();
  const dateString = typeof date === 'string' ? date : formatDateToYYYYMMDD(date);
  return todayString === dateString;
};

/**
 * 日付が指定した日数以内（日本時間）かどうかをチェック
 */
export const isWithinDays = (date: Date | string, days: number): boolean => {
  const dateString = typeof date === 'string' ? date : formatDateToYYYYMMDD(date);
  const targetDate = parseJapanDateString(dateString);
  const today = getJapanDate();
  const diffDays = getDaysDifference(today, targetDate);
  return diffDays <= days;
};

/**
 * 月の最初の日を取得（YYYY-MM-DD形式）
 */
export const getMonthStart = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

/**
 * 月の最後の日を取得（YYYY-MM-DD形式）
 */
export const getMonthEnd = (year: number, month: number): string => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
};

/**
 * 日本時間での時刻表示用フォーマット
 */
export const formatJapanDateTime = (date: Date): string => {
  const japanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  return japanTime.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 日本時間での日付表示用フォーマット
 */
export const formatJapanDate = (date: Date): string => {
  const japanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  return japanTime.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

/**
 * 指定年月の日付リストを生成（日本時間ベース）
 */
export const generateDayList = (year: number, month: number): Array<{
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isWeekend: boolean;
}> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = getTodayJapanDateString();
  const dayList = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = parseJapanDateString(dateString);
    const dayOfWeek = dateObj.getDay();
    
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isWeekend = isSaturday || isSunday;
    const isToday = dateString === today;

    dayList.push({
      date: dateString,
      dayOfMonth: day,
      isToday,
      isSaturday,
      isSunday,
      isWeekend,
    });
  }

  return dayList;
};

/**
 * 日付表示用フォーマット（RecordListView用）
 */
export const formatDateDisplay = (dateString: string): string => {
  const date = parseJapanDateString(dateString);
  return date.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
};