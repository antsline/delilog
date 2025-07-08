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
    
    dayList.push({
      dayOfMonth: day,
      dateStr,
      isToday,
      date,
      isSaturday: isSat,
      isSunday: isSun,
      isWeekend: isSat || isSun
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