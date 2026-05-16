import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import BankUpiDetailsScreen from '@features/auth/screens/female/BankUpiDetailsScreen';
import FaceCaptureScreen from '@features/auth/screens/female/FaceCaptureScreen';
import FemaleSignupBasicInfoScreen from '@features/auth/screens/female/FemaleSignupBasicInfoScreen';
import VerificationInfoScreen from '@features/auth/screens/female/VerificationInfoScreen';
import VerificationSubmittedScreen from '@features/auth/screens/female/VerificationSubmittedScreen';
import ForgotPasswordNewScreen from '@features/auth/screens/forgotPassword/ForgotPasswordNewScreen';
import ForgotPasswordPhoneScreen from '@features/auth/screens/forgotPassword/ForgotPasswordPhoneScreen';
import FemaleLoginPasswordScreen from '@features/auth/screens/login/FemaleLoginPasswordScreen';
import FemaleLoginPhoneScreen from '@features/auth/screens/login/FemaleLoginPhoneScreen';
import MaleLoginScreen from '@features/auth/screens/login/MaleLoginScreen';
import MaleSignupBasicInfoScreen from '@features/auth/screens/male/MaleSignupBasicInfoScreen';
import OtpVerificationScreen from '@features/auth/screens/shared/OtpVerificationScreen';
import AccountTypeScreen from '@features/onboarding/screens/AccountTypeScreen';
import MaleOnboardingCarousel from '@features/onboarding/screens/MaleOnboardingCarousel';
import SplashScreen from '@features/splash/screens/SplashScreen';

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
  return (
    <Stack.Navigator
      initialRouteName="Splash"
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

      <Stack.Screen name="FemaleLoginPhone" component={FemaleLoginPhoneScreen} />
      <Stack.Screen name="FemaleLoginPassword" component={FemaleLoginPasswordScreen} />
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
