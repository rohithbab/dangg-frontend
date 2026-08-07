import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';

import {
  useIsAuthenticated,
  useIsBootstrapped,
  useSessionRole,
  useVerificationStatus,
} from '@store/sessionStore';

import SplashScreen from '@features/splash/screens/SplashScreen';

import { UserRole, VerificationStatus } from '@app-types/domain';

import AuthNavigator from './AuthNavigator';
import ChatNavigator from './ChatNavigator';
import FemaleAppStack from './FemaleAppStack';
import MaleAppStack from './MaleAppStack';
import { type RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level switcher.
 *
 *   * Booting        → Boot splash (session still resolving).
 *   * No session     → Auth flow (onboarding → signup/login).
 *   * Female verified → FemaleAppStack.
 *   * Female unverified → AuthNavigator, gated to the verification screens.
 *   * Male           → MaleAppStack.
 *
 * The boot gate matters for more than cosmetics. Restoring the Supabase
 * session from the Keychain is async, so the first frames of every cold start
 * look logged-out. Mounting AuthNavigator against that stale state is what
 * bounced restored users to Login — and because `initialRouteName` is only
 * read on first mount, the later hydration could never correct it. Holding
 * the splash until `bootstrapped` means AuthNavigator mounts exactly once,
 * already knowing the role and verification status.
 *
 * Chat navigator is registered so any post-auth flow can push into it.
 */
function RootNavigator(): React.ReactElement {
  const bootstrapped = useIsBootstrapped();
  const authed = useIsAuthenticated();
  const role = useSessionRole();
  const verificationStatus = useVerificationStatus();
  const [splashPlayed, setSplashPlayed] = useState(false);

  const handleSplashDone = useCallback((): void => setSplashPlayed(true), []);

  // A female enters the main app only when verified. If unverified (none,
  // rejected, or pending), she falls back to the AuthNavigator which displays
  // the verification capture or status submission screen.
  const showFemaleApp =
    authed && role === UserRole.Female && verificationStatus === VerificationStatus.Verified;
  const showMaleApp = authed && role === UserRole.Male;

  // Both halves must land: the session has to be resolved AND the brand
  // animation has to finish, so a fast restore doesn't flash the splash.
  const ready = bootstrapped && splashPlayed;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!ready ? (
        <Stack.Screen name="Boot">{() => <SplashScreen onDone={handleSplashDone} />}</Stack.Screen>
      ) : showFemaleApp ? (
        <Stack.Screen name="FemaleApp" component={FemaleAppStack} />
      ) : showMaleApp ? (
        <Stack.Screen name="MaleApp" component={MaleAppStack} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
      <Stack.Screen name="Chat" component={ChatNavigator} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
