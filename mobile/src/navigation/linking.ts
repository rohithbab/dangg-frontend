import { type LinkingOptions } from '@react-navigation/native';

import { DEEP_LINK_PREFIX } from '@core/config/constants';

import { type RootStackParamList } from './types';

/**
 * Deep-link configuration.
 *
 * Bind FCM notification taps + universal links here so a tap on a push
 * lands the user on the right screen even from a cold start. Paths mirror
 * the screen tree under each navigator.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEP_LINK_PREFIX, 'https://dangg.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          AccountType: 'onboarding/account-type',
          MaleOnboardingCarousel: 'onboarding/male',

          FemaleSignupBasicInfo: 'auth/female/signup/basic-info',
          FemaleSignupOtp: 'auth/female/signup/otp',
          FemaleSignupBankUpi: 'auth/female/signup/payout-details',
          FemaleSignupVerificationInfo: 'auth/female/signup/verification-info',
          FemaleSignupFaceCapture: 'auth/female/signup/face-capture',
          FemaleSignupVerificationSubmitted: 'auth/female/signup/verification-submitted',

          MaleSignupBasicInfo: 'auth/male/signup/basic-info',
          MaleSignupOtp: 'auth/male/signup/otp',

          FemaleLoginPhone: 'auth/female/login/phone',
          FemaleLoginPassword: 'auth/female/login/password',
          MaleLogin: 'auth/male/login',

          ForgotPasswordPhone: 'auth/forgot-password/phone',
          ForgotPasswordOtp: 'auth/forgot-password/otp',
          ForgotPasswordNew: 'auth/forgot-password/new-password',
        },
      },
      FemaleTabs: {
        screens: {
          FemaleHome: 'female/home',
          FemaleEarnings: 'female/earnings',
          FemaleProfile: 'female/profile',
        },
      },
      MaleTabs: {
        screens: {
          MaleWallet: 'male/wallet',
          MaleHome: 'male/home',
          MaleProfile: 'male/profile',
        },
      },
      Chat: {
        screens: {
          ChatRequestSent: 'chat/sent/:femaleId',
          ChatRequestAccepted: 'chat/accepted/:femaleId',
          ChatRequestDeclined: 'chat/declined/:femaleId',
          ChatRequestTimeout: 'chat/timeout/:femaleId',
          QueuePosition: 'chat/queue/:femaleId',
          LikeDislikeRating: 'chat/rate/:femaleId',
        },
      },
    },
  },
};
