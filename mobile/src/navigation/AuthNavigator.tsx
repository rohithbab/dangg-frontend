import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useIsAuthenticated, useSessionRole, useVerificationStatus } from '@store/sessionStore';

import BankUpiDetailsScreen from '@features/auth/screens/female/BankUpiDetailsScreen';
import FaceCaptureScreen from '@features/auth/screens/female/FaceCaptureScreen';
import VerificationInfoScreen from '@features/auth/screens/female/VerificationInfoScreen';
import VerificationSubmittedScreen from '@features/auth/screens/female/VerificationSubmittedScreen';
import LoginPhoneScreen from '@features/auth/screens/login/LoginPhoneScreen';
import OtpVerificationScreen from '@features/auth/screens/shared/OtpVerificationScreen';
import SignupPhoneScreen from '@features/auth/screens/signup/SignupPhoneScreen';
import SignupProfileScreen from '@features/auth/screens/signup/SignupProfileScreen';
import AccountTypeScreen from '@features/onboarding/screens/AccountTypeScreen';
import MaleOnboardingCarousel from '@features/onboarding/screens/MaleOnboardingCarousel';
import SplashScreen from '@features/splash/screens/SplashScreen';

import { UserRole, VerificationStatus } from '@app-types/domain';

import { type AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth + onboarding stack. Every route resolves to its real screen.
 *
 * Custom transitions:
 *   * Splash and AccountType fade in/out.
 *   * VerificationSubmitted and ForgotPasswordNew disable back gesture +
 *     hide the back affordance so users can't slip back into prior steps.
 */
function AuthNavigator(): React.ReactElement {
  const authed = useIsAuthenticated();
  const role = useSessionRole();
  const verificationStatus = useVerificationStatus();

  let initialRoute: keyof AuthStackParamList = 'Splash';
  if (authed && role === UserRole.Female) {
    if (verificationStatus === VerificationStatus.Pending) {
      initialRoute = 'FemaleSignupVerificationSubmitted';
    } else if (
      verificationStatus === VerificationStatus.None ||
      verificationStatus === VerificationStatus.Rejected
    ) {
      initialRoute = 'FemaleSignupVerificationInfo';
    }
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="AccountType"
        component={AccountTypeScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="MaleOnboardingCarousel" component={MaleOnboardingCarousel} />

      <Stack.Screen name="SignupPhone" component={SignupPhoneScreen} />
      <Stack.Screen name="SignupOtp" component={OtpVerificationScreen} />
      <Stack.Screen name="SignupProfile" component={SignupProfileScreen} />

      <Stack.Screen name="FemaleSignupBankUpi" component={BankUpiDetailsScreen} />
      <Stack.Screen name="FemaleSignupVerificationInfo" component={VerificationInfoScreen} />
      <Stack.Screen name="FemaleSignupFaceCapture" component={FaceCaptureScreen} />
      <Stack.Screen
        name="FemaleSignupVerificationSubmitted"
        component={VerificationSubmittedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      <Stack.Screen name="LoginPhone" component={LoginPhoneScreen} />
      <Stack.Screen name="LoginOtp" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
