import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useIsAuthenticated, useSessionRole, useVerificationStatus } from '@store/sessionStore';

import BankUpiDetailsScreen from '@features/auth/screens/female/BankUpiDetailsScreen';
import FaceCaptureScreen from '@features/auth/screens/female/FaceCaptureScreen';
import FemaleSignupBasicInfoScreen from '@features/auth/screens/female/FemaleSignupBasicInfoScreen';
import VerificationInfoScreen from '@features/auth/screens/female/VerificationInfoScreen';
import VerificationSubmittedScreen from '@features/auth/screens/female/VerificationSubmittedScreen';
import ForgotPasswordNewScreen from '@features/auth/screens/forgotPassword/ForgotPasswordNewScreen';
import ForgotPasswordPhoneScreen from '@features/auth/screens/forgotPassword/ForgotPasswordPhoneScreen';
import CommonLoginScreen from '@features/auth/screens/login/CommonLoginScreen';
import FemaleLoginScreen from '@features/auth/screens/login/FemaleLoginScreen';
import MaleLoginScreen from '@features/auth/screens/login/MaleLoginScreen';
import MaleSignupBasicInfoScreen from '@features/auth/screens/male/MaleSignupBasicInfoScreen';
import OtpVerificationScreen from '@features/auth/screens/shared/OtpVerificationScreen';
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
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
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

      <Stack.Screen name="FemaleSignupBasicInfo" component={FemaleSignupBasicInfoScreen} />
      <Stack.Screen name="FemaleSignupOtp" component={OtpVerificationScreen} />
      <Stack.Screen name="FemaleSignupBankUpi" component={BankUpiDetailsScreen} />
      <Stack.Screen name="FemaleSignupVerificationInfo" component={VerificationInfoScreen} />
      <Stack.Screen name="FemaleSignupFaceCapture" component={FaceCaptureScreen} />
      <Stack.Screen
        name="FemaleSignupVerificationSubmitted"
        component={VerificationSubmittedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      <Stack.Screen name="MaleSignupBasicInfo" component={MaleSignupBasicInfoScreen} />
      <Stack.Screen name="MaleSignupOtp" component={OtpVerificationScreen} />

      <Stack.Screen name="CommonLogin" component={CommonLoginScreen} />
      <Stack.Screen name="FemaleLogin" component={FemaleLoginScreen} />
      <Stack.Screen name="MaleLogin" component={MaleLoginScreen} />

      <Stack.Screen name="ForgotPasswordPhone" component={ForgotPasswordPhoneScreen} />
      <Stack.Screen name="ForgotPasswordOtp" component={OtpVerificationScreen} />
      <Stack.Screen
        name="ForgotPasswordNew"
        component={ForgotPasswordNewScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
