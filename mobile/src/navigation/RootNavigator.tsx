import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useIsAuthenticated, useSessionRole, useVerificationStatus } from '@store/sessionStore';

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
 * Reads session + role from Zustand:
 *   * No session  → Auth flow (splash → onboarding → signup/login).
 *   * Session + female (verified) → FemaleAppStack.
 *   * Session + female (unverified) → AuthNavigator (gated to verification info/submitted).
 *   * Session + male  → MaleTabs.
 *
 * Chat navigator is registered so any post-auth flow can push into it.
 */
function RootNavigator(): React.ReactElement {
  const authed = useIsAuthenticated();
  const role = useSessionRole();
  const verificationStatus = useVerificationStatus();

  // A female enters the main app only when verified. If unverified (none,
  // rejected, or pending), she falls back to the AuthNavigator which displays
  // the verification capture or status submission screen.
  const showFemaleApp =
    authed && role === UserRole.Female && verificationStatus === VerificationStatus.Verified;
  const showMaleApp = authed && role === UserRole.Male;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {showFemaleApp ? (
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
