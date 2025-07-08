/**
 * ユーザー向けエラーメッセージ定数
 */

import { ErrorCode } from '@/types/error';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // ネットワークエラー
  [ErrorCode.NETWORK_ERROR]: 'インターネット接続を確認してください',
  [ErrorCode.CONNECTION_TIMEOUT]: '通信がタイムアウトしました。しばらく待ってから再試行してください',
  [ErrorCode.SERVER_ERROR]: 'サーバーで問題が発生しています。しばらく待ってから再試行してください',

  // 認証エラー
  [ErrorCode.AUTH_FAILED]: '認証に失敗しました。再度お試しください',
  [ErrorCode.AUTH_EXPIRED]: '認証が期限切れです。再度ログインしてください',
  [ErrorCode.AUTH_PERMISSION_DENIED]: 'この操作を実行する権限がありません',
  [ErrorCode.AUTH_PROVIDER_ERROR]: '認証プロバイダーで問題が発生しました',

  // データベースエラー
  [ErrorCode.DATABASE_ERROR]: 'データベース処理でエラーが発生しました',
  [ErrorCode.DATA_NOT_FOUND]: '該当するデータが見つかりません',
  [ErrorCode.DATA_CONFLICT]: 'すでに同じデータが存在します',
  [ErrorCode.DATA_VALIDATION_ERROR]: 'データの形式が正しくありません',

  // ファイル・PDF エラー
  [ErrorCode.PDF_GENERATION_ERROR]: 'PDFの生成に失敗しました',
  [ErrorCode.FILE_ACCESS_ERROR]: 'ファイルにアクセスできません',
  [ErrorCode.SHARING_UNAVAILABLE]: '共有機能が利用できません',

  // ユーザー入力エラー
  [ErrorCode.VALIDATION_ERROR]: '入力内容に不備があります。確認して再度お試しください',
  [ErrorCode.REQUIRED_FIELD_MISSING]: '必須項目が入力されていません',
  [ErrorCode.INVALID_FORMAT]: '入力形式が正しくありません',

  // アプリケーションエラー
  [ErrorCode.UNKNOWN_ERROR]: '予期しないエラーが発生しました',
  [ErrorCode.OPERATION_CANCELLED]: '操作がキャンセルされました',
  [ErrorCode.FEATURE_UNAVAILABLE]: 'この機能は現在利用できません',
};

/**
 * 操作別の詳細なエラーメッセージ
 */
export const OPERATION_ERROR_MESSAGES = {
  // 認証操作
  login: {
    apple: {
      failed: 'Apple IDでのログインに失敗しました',
      cancelled: 'Apple IDでのログインがキャンセルされました',
      unavailable: 'Apple IDログインは利用できません',
    },
    google: {
      failed: 'Googleでのログインに失敗しました',
      cancelled: 'Googleでのログインがキャンセルされました',
      unavailable: 'Googleログインは利用できません',
    },
    test: {
      failed: 'テストログインに失敗しました',
    },
  },

  // プロフィール操作
  profile: {
    create: {
      failed: 'プロフィールの作成に失敗しました',
      validation: 'プロフィール情報に不備があります',
    },
    update: {
      failed: 'プロフィールの更新に失敗しました',
      validation: 'プロフィール情報に不備があります',
    },
    fetch: {
      failed: 'プロフィール情報の取得に失敗しました',
      notFound: 'プロフィール情報が見つかりません',
    },
  },

  // 車両操作
  vehicle: {
    create: {
      failed: '車両の登録に失敗しました',
      duplicate: 'この車両は既に登録されています',
      validation: '車両情報に不備があります',
    },
    update: {
      failed: '車両情報の更新に失敗しました',
      notFound: '車両が見つかりません',
      validation: '車両情報に不備があります',
    },
    delete: {
      failed: '車両の削除に失敗しました',
      notFound: '車両が見つかりません',
      inUse: 'この車両は使用中のため削除できません',
    },
    fetch: {
      failed: '車両情報の取得に失敗しました',
      empty: '登録されている車両がありません',
    },
  },

  // 点呼記録操作
  tenko: {
    create: {
      failed: '点呼記録の保存に失敗しました',
      duplicate: 'この日付の記録は既に存在します',
      validation: '点呼記録に不備があります',
    },
    update: {
      failed: '点呼記録の更新に失敗しました',
      notFound: '点呼記録が見つかりません',
      validation: '点呼記録に不備があります',
    },
    fetch: {
      failed: '点呼記録の取得に失敗しました',
      empty: '記録されたデータがありません',
    },
    delete: {
      failed: '点呼記録の削除に失敗しました',
      notFound: '点呼記録が見つかりません',
    },
  },

  // PDF操作
  pdf: {
    generate: {
      failed: 'PDFの生成に失敗しました',
      dataEmpty: '出力するデータがありません',
      templateError: 'PDFテンプレートでエラーが発生しました',
    },
    share: {
      failed: 'PDFの共有に失敗しました',
      cancelled: 'PDFの共有がキャンセルされました',
      unavailable: '共有機能が利用できません',
    },
    save: {
      failed: 'PDFの保存に失敗しました',
      permissionDenied: 'ファイルの保存権限がありません',
    },
  },

  // 運行なし日操作
  noOperation: {
    toggle: {
      failed: '運行なし状態の変更に失敗しました',
      validation: '日付の形式が正しくありません',
    },
    fetch: {
      failed: '運行なし日の取得に失敗しました',
    },
  },

  // 音声入力操作
  voice: {
    record: {
      failed: '音声録音に失敗しました',
      permissionDenied: 'マイクの使用権限がありません',
      unavailable: '音声録音機能が利用できません',
    },
    transcribe: {
      failed: '音声認識に失敗しました',
      unavailable: '音声認識機能が利用できません',
    },
  },
};

/**
 * 復旧アクション用のメッセージ
 */
export const RECOVERY_MESSAGES = {
  retry: '再試行',
  retryWithDelay: 'しばらく待ってから再試行',
  login: '再ログイン',
  refresh: '更新',
  goOffline: 'オフラインで続行',
  contactSupport: 'サポートに連絡',
  goBack: '前の画面に戻る',
  dismiss: '閉じる',
};

/**
 * 操作完了メッセージ
 */
export const SUCCESS_MESSAGES = {
  login: 'ログインしました',
  logout: 'ログアウトしました',
  profileCreated: 'プロフィールを作成しました',
  profileUpdated: 'プロフィールを更新しました',
  vehicleCreated: '車両を登録しました',
  vehicleUpdated: '車両情報を更新しました',
  vehicleDeleted: '車両を削除しました',
  tenkoSaved: '点呼記録を保存しました',
  tenkoUpdated: '点呼記録を更新しました',
  pdfGenerated: 'PDFを生成しました',
  pdfShared: 'PDFを共有しました',
  noOperationToggled: '運行状態を変更しました',
};

/**
 * 確認メッセージ
 */
export const CONFIRMATION_MESSAGES = {
  vehicleDelete: 'この車両を削除しますか？',
  tenkoDelete: 'この点呼記録を削除しますか？',
  logout: 'ログアウトしますか？',
  dataLoss: '入力中のデータが失われますが、続行しますか？',
  overwrite: '既存のデータを上書きしますか？',
  noOperationToggle: (date: string, isNoOperation: boolean) => 
    `${date}を${isNoOperation ? '運行あり' : '運行なし'}に変更しますか？`,
};

/**
 * バリデーションメッセージ
 */
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field}は必須です`,
  minLength: (field: string, min: number) => `${field}は${min}文字以上で入力してください`,
  maxLength: (field: string, max: number) => `${field}は${max}文字以内で入力してください`,
  email: 'メールアドレスの形式が正しくありません',
  phoneNumber: '電話番号の形式が正しくありません',
  vehicleNumber: 'ナンバープレートの形式が正しくありません',
  alcoholLevel: 'アルコール数値は0.00以上で入力してください',
  positiveNumber: '0以上の数値を入力してください',
  dateFormat: '日付の形式が正しくありません',
  timeFormat: '時刻の形式が正しくありません',
};