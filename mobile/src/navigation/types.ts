import { type NavigatorScreenParams } from '@react-navigation/native';

/** Auth-stack route params — every screen typed for `navigation.navigate(...)`. */
export type AuthStackParamList = {
  Splash: undefined;

  AccountType: undefined;
  MaleOnboardingCarousel: undefined;

  // Signup: Phone → OTP → Profile (role/name/age collected on the Profile step).
  SignupPhone: undefined;
  SignupOtp: { phone: string };
  SignupProfile: undefined;

  // Female post-profile verification flow.
  FemaleSignupBankUpi: undefined;
  FemaleSignupVerificationInfo: undefined;
  FemaleSignupFaceCapture: undefined;
  FemaleSignupVerificationSubmitted: undefined;

  // OTP login (no passwords anywhere in the app).
  LoginPhone: undefined;
  LoginOtp: { phone: string };
};

/** Female bottom-tabs — order in nav is Earnings | Home (FAB) | Profile. */
export type FemaleTabParamList = {
  Earnings: undefined;
  Home: undefined;
  Profile: undefined;
};

/** Female app stack — tabs as root + push-able secondary screens. */
export type FemaleAppStackParamList = {
  FemaleTabs: NavigatorScreenParams<FemaleTabParamList>;
  ChatsInbox: undefined;
  Notifications: undefined;
  BankUpiUpdate: undefined;
  HelpSupport: undefined;
  ReportIssue: undefined;
  AboutApp: undefined;
  Settings: undefined;
  /** Placeholder for the payout flow shipped in a later prompt. */
  PayoutRequest: undefined;
  PayoutInReview: { amount: number; payoutMethod: string };
  DeleteAccount: undefined;
  DeleteAccountConfirm: undefined;
  NotificationPermission: undefined;
  ChatRequestAccepted: { requestId: string };
  ChatSession: { requestId: string };
};

/** Male bottom-tabs — order in nav is Wallet | Home (FAB) | Profile. */
export type MaleTabParamList = {
  Wallet: undefined;
  Home: undefined;
  Profile: undefined;
};

/** Male app stack — tabs as root + push-able secondary screens. */
export type MaleAppStackParamList = {
  MaleTabs: NavigatorScreenParams<MaleTabParamList>;
  ChatsInbox: undefined;
  FemaleProfilePreview: { femaleId: string };
  ChatRequestSent: { requestId: string };
  ChatRequestAccepted: { requestId: string };
  ChatRequestDeclined: { requestId: string };
  ChatRequestTimeout: { requestId: string };
  ChatSession: { requestId: string };
  PaymentProcessing: { packageId: string };
  PaymentSuccess: {
    transactionId: string;
    coinsAdded: number;
    bonusCoins: number;
    amountInr: number;
    newBalance: number;
  };
  PaymentFailed: { packageId: string; reason: string };
  Notifications: undefined;
  HelpSupport: undefined;
  ReportIssue: undefined;
  AboutApp: undefined;
  Settings: undefined;
  DeleteAccount: undefined;
  DeleteAccountConfirm: undefined;
  NotificationPermission: undefined;
  LikeDislikeRating: { femaleId: string; requestId: string };
};

/** Chat-request flow (Phase 1 only). Placeholder for the Phase 2 chat screen. */
export type ChatStackParamList = {
  ChatRequestSent: { femaleId: string };
  ChatRequestAccepted: { femaleId: string };
  ChatRequestDeclined: { femaleId: string };
  ChatRequestTimeout: { femaleId: string };
  QueuePosition: { femaleId: string; position: number };
  LikeDislikeRating: { femaleId: string };
};

/** Top-level navigator selecting between Auth and the role-specific app shell. */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  FemaleApp: NavigatorScreenParams<FemaleAppStackParamList>;
  MaleApp: NavigatorScreenParams<MaleAppStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
};

// Augment React Navigation's global types so screens get typed `navigation`
// and `route` without per-screen generics. `namespace` is unavoidable here
// — it's the API React Navigation exposes for global augmentation.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
