import { z } from 'zod';

export const tenkoBeforeSchema = z.object({
  vehicleId: z.string().min(1, '車両を選択してください'),
  checkMethod: z.string().min(1, '点呼方法を入力してください'),
  executor: z.string().min(1, '執行者名を入力してください'),
  alcoholLevel: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'アルコール数値は数字で入力してください（例: 0.00）')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0 && num <= 10;
    }, 'アルコール数値は0.00〜10.00の範囲で入力してください'),
  healthStatus: z.enum(['good', 'caution', 'poor'], {
    errorMap: () => ({ message: '健康状態を選択してください' })
  }),
  dailyCheckCompleted: z.boolean(),
  notes: z.string().max(500, '特記事項は500文字以内で入力してください').optional(),
});

export const tenkoAfterSchema = z.object({
  vehicleId: z.string().min(1, '車両を選択してください'),
  checkMethod: z.string().min(1, '点呼方法を入力してください'),
  executor: z.string().min(1, '執行者名を入力してください'),
  alcoholLevel: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'アルコール数値は数字で入力してください（例: 0.00）')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0 && num <= 10;
    }, 'アルコール数値は0.00〜10.00の範囲で入力してください'),
  healthStatus: z.enum(['good', 'caution', 'poor'], {
    errorMap: () => ({ message: '健康状態を選択してください' })
  }),
  operationStatus: z.enum(['ok', 'ng'], {
    errorMap: () => ({ message: '運行状況を選択してください' })
  }),
  notes: z.string().max(500, '特記事項は500文字以内で入力してください').optional(),
});

export type TenkoBeforeFormData = z.infer<typeof tenkoBeforeSchema>;
export type TenkoAfterFormData = z.infer<typeof tenkoAfterSchema>;