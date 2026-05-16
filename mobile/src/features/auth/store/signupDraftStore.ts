import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { type UserRole } from '@app-types/domain';

/** Bank-account payout details. Mirror this in the backend payouts table. */
export type BankDetails = {
  holderName: string;
  accountNumber: string;
  ifsc: string;
};

/** Discriminated payout mode — exactly one of bank or upi at any time. */
export type PayoutDetails = { kind: 'bank'; bank: BankDetails } | { kind: 'upi'; upiId: string };

/** Discriminator for the current step inside the multi-screen signup flow. */
export type SignupStep =
  | 'idle'
  | 'basicInfo'
  | 'otp'
  | 'payoutDetails'
  | 'verificationInfo'
  | 'faceCapture'
  | 'onboarding'
  | 'submitted';

type SignupDraftFields = {
  role: UserRole | null;
  phone: string;
  name: string;
  age: number | null;
  /** Plain text. Cleared from memory on `clear()` — never persisted. */
  password: string;
  payout: PayoutDetails | null;
  verificationPhotoPath: string | null;
  currentStep: SignupStep;
};

type SignupDraftActions = {
  setBasicInfo(data: {
    role: UserRole;
    name: string;
    age: number;
    password: string;
    phone: string;
  }): void;
  setPayoutDetails(data: PayoutDetails): void;
  skipPayoutDetails(): void;
  setVerificationPhoto(path: string): void;
  setStep(step: SignupStep): void;
  clear(): void;
};

export type SignupDraftState = SignupDraftFields & SignupDraftActions;

const EMPTY: SignupDraftFields = {
  role: null,
  phone: '',
  name: '',
  age: null,
  password: '',
  payout: null,
  verificationPhotoPath: null,
  currentStep: 'idle',
};

/**
 * In-memory draft of an in-progress signup.
 *
 * Intentionally NOT persisted — if the app is killed mid-signup the user
 * restarts with their phone number as the recovery anchor (verify status
 * lookup at login routes them back into the correct step). Persisting raw
 * password text to disk would be a needless DPDP exposure.
 *
 * Subscribe with selectors only — `useSignupDraftStore(s => s.phone)` —
 * to avoid re-rendering on unrelated slice updates.
 */
export const useSignupDraftStore = create<SignupDraftState>()(
  subscribeWithSelector(set => ({
    ...EMPTY,

    setBasicInfo: ({ role, name, age, password, phone }): void =>
      set({ role, name, age, password, phone, currentStep: 'otp' }),

    setPayoutDetails: (data): void => set({ payout: data, currentStep: 'verificationInfo' }),

    skipPayoutDetails: (): void => set({ payout: null, currentStep: 'verificationInfo' }),

    setVerificationPhoto: (path): void =>
      set({ verificationPhotoPath: path, currentStep: 'submitted' }),

    setStep: (step): void => set({ currentStep: step }),

    clear: (): void => set({ ...EMPTY }),
  })),
);
