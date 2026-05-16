import { z } from 'zod';

import { ZodSchemas } from '@core/utils/validators';

/**
 * Form schemas for the auth flow. Compose `ZodSchemas` primitives where
 * possible so phone/password/upi/ifsc rules stay aligned with `Validators`.
 */

/** Min/max age the app accepts at signup. Both inclusive. */
export const MIN_AGE = 18;
export const MAX_AGE = 65;

const ageString = z
  .string()
  .trim()
  .refine(v => /^\d{1,3}$/.test(v), 'Enter age as a number')
  .transform(v => Number.parseInt(v, 10))
  .refine(n => n >= MIN_AGE && n <= MAX_AGE, `Age must be between ${MIN_AGE} and ${MAX_AGE}`);

/** Female / male signup share the same basic-info shape. Role is set by caller. */
export const basicInfoSchema = z
  .object({
    name: ZodSchemas.name,
    age: ageString,
    password: ZodSchemas.password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    phone: ZodSchemas.phoneIndian,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type BasicInfoInput = z.input<typeof basicInfoSchema>;
export type BasicInfoOutput = z.output<typeof basicInfoSchema>;

/** Bank-account payout fields. */
export const bankAccountSchema = z
  .object({
    holderName: ZodSchemas.name,
    accountNumber: z
      .string()
      .trim()
      .refine(v => /^\d{9,18}$/.test(v), 'Account number must be 9–18 digits'),
    confirmAccountNumber: z.string().trim().min(1, 'Re-enter the account number'),
    ifsc: ZodSchemas.ifsc,
  })
  .superRefine((data, ctx) => {
    if (data.accountNumber !== data.confirmAccountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmAccountNumber'],
        message: 'Account numbers do not match',
      });
    }
  });

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

/** UPI payout fields. */
export const upiSchema = z.object({
  upiId: ZodSchemas.upiId,
});

export type UpiInput = z.infer<typeof upiSchema>;

/** Phone-only schema, used by login + forgot-password phone entry. */
export const phoneOnlySchema = z.object({
  phone: ZodSchemas.phoneIndian,
});

export type PhoneOnlyInput = z.infer<typeof phoneOnlySchema>;

/** Password-only schema, used by login. */
export const passwordOnlySchema = z.object({
  password: z.string().min(1, 'Enter your password'),
});

export type PasswordOnlyInput = z.infer<typeof passwordOnlySchema>;

/** New-password schema for forgot-password reset. */
export const newPasswordSchema = z
  .object({
    newPassword: ZodSchemas.password,
    confirmNewPassword: z.string().min(1, 'Confirm the new password'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmNewPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
