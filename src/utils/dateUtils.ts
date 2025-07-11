/**
 * 日付関連のユーティリティ関数
 */

/**
 * 指定した月の日付配列を生成する
 * @param year 年
 * @param month 月 (0-11)
 * @returns 日付配列（前月末・当月・次月初を含む6週分）
 */
export function generateCalendarDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0: 日曜日
  const daysInMonth = lastDay.getDate();
  
  const dates: Date[] = [];
  
  // 前月の末尾日付を追加（週の始まりを日曜日に合わせる）
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    dates.push(prevDate);
  }
  
  // 当月の日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }
  
  // 次月の初期日付を追加（6週分になるまで）
  const remainingDays = 42 - dates.length; // 6週 × 7日
  for (let day = 1; day <= remainingDays; day++) {
    dates.push(new Date(year, month + 1, day));
  }
  
  return dates;
}

/**
 * 日付が同じ月かどうかを判定
 */
export function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * 日付が今日かどうかを判定
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * 日付が土曜日かどうかを判定
 */
export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * 日付が日曜日かどうかを判定
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 月名を日本語で取得
 */
export function getMonthName(month: number): string {
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  return monthNames[month];
}

/**
 * 曜日名を日本語で取得
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return dayNames[dayOfWeek];
}

/**
 * 指定した月の日付リストを生成（縦スクロール用）
 */
export function generateDayList(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  const dayList = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateKey(date);
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    const dayOfWeek = date.getDay();
    const isSat = dayOfWeek === 6;
    const isSun = dayOfWeek === 0;
    const isHoliday = isJapaneseHoliday(date);
    
    dayList.push({
      dayOfMonth: day,
      dateStr,
      isToday,
      date,
      isSaturday: isSat,
      isSunday: isSun,
      isWeekend: isSat || isSun,
      isHoliday
    });
  }
  
  return dayList;
}

/**
 * 年月を表示用にフォーマット
 */
export function formatDateDisplay(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

/**
 * 今日が週末かどうかを判定
 */
export function isWeekend(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay(); // 0: Sunday, 6: Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 今日が平日かどうかを判定
 */
export function isWeekday(date: Date = new Date()): boolean {
  return !isWeekend(date);
}

/**
 * 時刻文字列（HH:MM）を今日の Date オブジェクトに変換
 */
export function timeStringToDate(timeString: string, date: Date = new Date()): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * 日本の祝日判定（包括版）
 */
export function isJapaneseHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 固定祝日
  const fixedHolidays = [
    '1-1',   // 元日
    '2-11',  // 建国記念の日
    '4-29',  // 昭和の日
    '5-3',   // 憲法記念日
    '5-4',   // みどりの日
    '5-5',   // こどもの日
    '8-11',  // 山の日
    '11-3',  // 文化の日
    '11-23', // 勤労感謝の日
    '12-23', // 天皇誕生日（2019年以降）
  ];
  
  const dateString = `${month}-${day}`;
  if (fixedHolidays.includes(dateString)) {
    return true;
  }
  
  // 移動祝日
  // 成人の日（1月第2月曜日）
  if (month === 1) {
    const secondMonday = getMonthWeekday(year, 1, 1, 2); // 第2月曜日
    if (day === secondMonday) return true;
  }
  
  // 海の日（7月第3月曜日）
  if (month === 7) {
    const thirdMonday = getMonthWeekday(year, 7, 1, 3); // 第3月曜日
    if (day === thirdMonday) return true;
  }
  
  // 敬老の日（9月第3月曜日）
  if (month === 9) {
    const thirdMonday = getMonthWeekday(year, 9, 1, 3); // 第3月曜日
    if (day === thirdMonday) return true;
  }
  
  // スポーツの日（10月第2月曜日）
  if (month === 10) {
    const secondMonday = getMonthWeekday(year, 10, 1, 2); // 第2月曜日
    if (day === secondMonday) return true;
  }
  
  // 春分の日・秋分の日（近似値）
  if (month === 3) {
    const shunbun = Math.floor(20.8431 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    if (day === shunbun) return true;
  }
  
  if (month === 9) {
    const shubun = Math.floor(23.2488 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    if (day === shubun) return true;
  }
  
  return false;
}

/**
 * 指定月の第n週の指定曜日を取得
 * @param year 年
 * @param month 月 (1-12)
 * @param weekday 曜日 (0:日曜日, 1:月曜日, ...)
 * @param week 第n週 (1-5)
 * @returns 日付
 */
function getMonthWeekday(year: number, month: number, weekday: number, week: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = firstDay.getDay();
  
  // 第1週の指定曜日を計算
  let targetDate = 1 + (weekday - firstWeekday + 7) % 7;
  
  // 第n週の指定曜日を計算
  targetDate += (week - 1) * 7;
  
  // 月の範囲内チェック
  const lastDay = new Date(year, month, 0).getDate();
  if (targetDate > lastDay) {
    return -1; // 存在しない日付
  }
  
  return targetDate;
}

/**
 * 営業日かどうかを判定（平日かつ非祝日）
 */
export function isBusinessDay(date: Date = new Date()): boolean {
  return isWeekday(date) && !isJapaneseHoliday(date);
}

/**
 * 時刻の形式化
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 通知スケジュールが有効かチェック
 */
export function shouldScheduleNotification(
  weekendEnabled: boolean,
  date: Date = new Date()
): boolean {
  // 平日は常に有効
  if (isWeekday(date)) {
    return true;
  }
  
  // 週末は設定に依存
  return weekendEnabled;
}