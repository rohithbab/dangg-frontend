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

          SignupPhone: 'auth/signup/phone',
          SignupOtp: 'auth/signup/otp',
          SignupProfile: 'auth/signup/profile',

          FemaleSignupBankUpi: 'auth/female/signup/payout-details',
          FemaleSignupVerificationInfo: 'auth/female/signup/verification-info',
          FemaleSignupFaceCapture: 'auth/female/signup/face-capture',
          FemaleSignupVerificationSubmitted: 'auth/female/signup/verification-submitted',

          LoginPhone: 'auth/login',
          LoginOtp: 'auth/login/otp',
        },
      },
      FemaleApp: {
        screens: {
          FemaleTabs: {
            screens: {
              Home: 'female/home',
              Earnings: 'female/earnings',
              Profile: 'female/profile',
            },
          },
          Notifications: 'female/notifications',
          BankUpiUpdate: 'female/bank-upi',
          HelpSupport: 'female/help',
          ReportIssue: 'female/report',
          AboutApp: 'female/about',
          Settings: 'female/settings',
          PayoutRequest: 'female/payout-request',
          DeleteAccount: 'female/delete-account',
        },
      },
      MaleApp: {
        screens: {
          MaleTabs: {
            screens: {
              Wallet: 'male/wallet',
              Home: 'male/home',
              Profile: 'male/profile',
            },
          },
          FemaleProfilePreview: 'male/female/:femaleId',
          ChatRequestSent: 'male/request/sent/:requestId',
          ChatRequestAccepted: 'male/request/accepted/:requestId',
          ChatRequestDeclined: 'male/request/declined/:requestId',
          ChatRequestTimeout: 'male/request/timeout/:requestId',
          PaymentProcessing: 'male/payment/processing/:packageId',
          PaymentSuccess: 'male/payment/success',
          PaymentFailed: 'male/payment/failed',
          Notifications: 'male/notifications',
          HelpSupport: 'male/help',
          ReportIssue: 'male/report',
          AboutApp: 'male/about',
          Settings: 'male/settings',
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
