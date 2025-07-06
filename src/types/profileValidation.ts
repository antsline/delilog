import { z } from 'zod';

export const profileUpdateSchema = z.object({
  companyName: z.string()
    .min(1, '屋号を入力してください')
    .max(100, '屋号は100文字以内で入力してください'),
  driverName: z.string()
    .min(1, '運転者名を入力してください')
    .max(50, '運転者名は50文字以内で入力してください'),
  officeName: z.string()
    .max(100, '営業所名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;