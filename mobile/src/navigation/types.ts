import { type NavigatorScreenParams } from '@react-navigation/native';

/** Auth-stack route params — every screen typed for `navigation.navigate(...)`. */
export type AuthStackParamList = {
  Splash: undefined;

  AccountType: undefined;
  MaleOnboardingCarousel: undefined;

  FemaleSignupBasicInfo: undefined;
  FemaleSignupOtp: { phone: string };
  FemaleSignupBankUpi: undefined;
  FemaleSignupVerificationInfo: undefined;
  FemaleSignupFaceCapture: undefined;
  FemaleSignupVerificationSubmitted: undefined;

  MaleSignupBasicInfo: undefined;
  MaleSignupOtp: { phone: string };

  FemaleLoginPhone: undefined;
  FemaleLoginPassword: { phone: string };
  MaleLogin: undefined;

  ForgotPasswordPhone: { role: 'female' | 'male' };
  ForgotPasswordOtp: { role: 'female' | 'male'; phone: string };
  ForgotPasswordNew: { role: 'female' | 'male'; phone: string };
};

/** Female bottom-tabs. */
export type FemaleTabParamList = {
  FemaleHome: undefined;
  FemaleEarnings: undefined;
  FemaleProfile: undefined;
};

/** Male bottom-tabs. */
export type MaleTabParamList = {
  MaleWallet: undefined;
  MaleHome: undefined;
  MaleProfile: undefined;
};

/** Chat-request flow (Phase 1 only). */
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
  FemaleTabs: NavigatorScreenParams<FemaleTabParamList>;
  MaleTabs: NavigatorScreenParams<MaleTabParamList>;
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
