import { z } from 'zod';

/**
 * Boolean validators (for ad-hoc checks) + matching Zod refinements (for
 * react-hook-form schemas). Keep behaviour aligned between the two by
 * routing both to the same regex.
 */
const PHONE_INDIAN = /^(?:\+?91|0)?[6-9]\d{9}$/;
const OTP = /^\d{6}$/;
const NAME = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const UPI_ID = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const Validators = {
  phoneIndian: (value: string): boolean => PHONE_INDIAN.test(value.trim()),
  otp: (value: string): boolean => OTP.test(value),
  name: (value: string): boolean => NAME.test(value.trim()),
  email: (value: string): boolean => EMAIL.test(value.trim()),
  upiId: (value: string): boolean => UPI_ID.test(value.trim()),
  ifsc: (value: string): boolean => IFSC.test(value.trim().toUpperCase()),

  /** Password rules: min 8 chars, at least one letter and one digit. */
  password(value: string): { valid: boolean; reason?: string } {
    if (!value) {
      return { valid: false, reason: 'Password is required' };
    }
    if (value.length < 8) {
      return { valid: false, reason: 'Password must be at least 8 characters' };
    }
    if (!/[A-Za-z]/.test(value)) {
      return { valid: false, reason: 'Include at least one letter' };
    }
    if (!/\d/.test(value)) {
      return { valid: false, reason: 'Include at least one number' };
    }
    return { valid: true };
  },
};

/** Reusable Zod schemas. Compose into screen-level form schemas. */
export const ZodSchemas = {
  phoneIndian: z.string().trim().refine(Validators.phoneIndian, 'Enter a valid 10-digit mobile'),

  otp: z.string().refine(Validators.otp, 'Enter the 6-digit OTP'),

  name: z.string().trim().refine(Validators.name, 'Enter a valid name'),

  password: z.string().refine(
    value => Validators.password(value).valid,
    value => ({
      message: Validators.password(value).reason ?? 'Invalid password',
    }),
  ),

  upiId: z.string().trim().refine(Validators.upiId, 'Enter a valid UPI ID'),

  ifsc: z
    .string()
    .trim()
    .transform(v => v.toUpperCase())
    .refine(Validators.ifsc, 'Enter a valid IFSC code'),
};
