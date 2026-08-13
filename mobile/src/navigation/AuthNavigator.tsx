import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';

import {
  useIsAuthenticated,
  useNeedsProfile,
  useSessionRole,
  useVerificationStatus,
} from '@store/sessionStore';

import BankUpiDetailsScreen from '@features/auth/screens/female/BankUpiDetailsScreen';
import FaceCaptureScreen from '@features/auth/screens/female/FaceCaptureScreen';
import VerificationInfoScreen from '@features/auth/screens/female/VerificationInfoScreen';
import VerificationSubmittedScreen from '@features/auth/screens/female/VerificationSubmittedScreen';
import LoginPhoneScreen from '@features/auth/screens/login/LoginPhoneScreen';
import OtpVerificationScreen from '@features/auth/screens/shared/OtpVerificationScreen';
import SignupPhoneScreen from '@features/auth/screens/signup/SignupPhoneScreen';
import SignupProfileScreen from '@features/auth/screens/signup/SignupProfileScreen';
import PolicyConsentScreen from '@features/legal/screens/PolicyConsentScreen';
import PolicyViewerScreen from '@features/legal/screens/PolicyViewerScreen';
import AccountTypeScreen from '@features/onboarding/screens/AccountTypeScreen';
import MaleOnboardingCarousel from '@features/onboarding/screens/MaleOnboardingCarousel';

import { UserRole, VerificationStatus } from '@app-types/domain';

import { resolveInitialRoute } from './authRouting';
import { navigationRef } from './navigationRef';
import { type AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth + onboarding stack. Every route resolves to its real screen.
 *
 * Custom transitions:
 *   * Splash, AccountType, and VerificationSubmitted fade in/out.
 *   * Swipe-back gesture is enabled on every screen (including these), no
 *     exceptions.
 */
function AuthNavigator(): React.ReactElement {
  const authed = useIsAuthenticated();
  const needsProfile = useNeedsProfile();
  const role = useSessionRole();
  const verificationStatus = useVerificationStatus();

  // Captured once: `initialRouteName` is only read on first mount, and
  // re-deriving it per render would fight the user's own navigation.
  const initialRouteRef = useRef<keyof AuthStackParamList | null>(null);
  if (initialRouteRef.current === null) {
    initialRouteRef.current = resolveInitialRoute(authed, needsProfile, role, verificationStatus);
  }
  const initialRoute = initialRouteRef.current;

  // Verification status can change *after* mount — the admin approves or
  // rejects while she sits on the waiting screen, arriving over Realtime.
  // Approval is handled by RootNavigator (it swaps to FemaleAppStack), but a
  // rejection has to move her off the waiting screen from here.
  const previousStatus = useRef(verificationStatus);
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = verificationStatus;
    if (before === verificationStatus || !authed || role !== UserRole.Female) {
      return;
    }
    if (!navigationRef.isReady()) {
      return;
    }
    if (verificationStatus === VerificationStatus.Rejected) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'FemaleSignupVerificationInfo' } }],
      });
    } else if (verificationStatus === VerificationStatus.Pending) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'FemaleSignupVerificationSubmitted' } }],
      });
    }
  }, [authed, role, verificationStatus]);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
    >
      <Stack.Screen
        name="AccountType"
        component={AccountTypeScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="MaleOnboardingCarousel" component={MaleOnboardingCarousel} />

      <Stack.Screen name="SignupPhone" component={SignupPhoneScreen} />
      <Stack.Screen name="SignupOtp" component={OtpVerificationScreen} />
      <Stack.Screen name="SignupConsent" component={PolicyConsentScreen} />
      <Stack.Screen name="SignupProfile" component={SignupProfileScreen} />
      <Stack.Screen name="PolicyViewer" component={PolicyViewerScreen} />

      <Stack.Screen name="FemaleSignupBankUpi" component={BankUpiDetailsScreen} />
      <Stack.Screen name="FemaleSignupVerificationInfo" component={VerificationInfoScreen} />
      <Stack.Screen name="FemaleSignupFaceCapture" component={FaceCaptureScreen} />
      <Stack.Screen
        name="FemaleSignupVerificationSubmitted"
        component={VerificationSubmittedScreen}
        options={{ animation: 'fade' }}
      />

      <Stack.Screen name="LoginPhone" component={LoginPhoneScreen} />
      <Stack.Screen name="LoginOtp" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
