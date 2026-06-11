import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useIsAuthenticated, useSessionRole } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

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
 *   * Session + female (any verification status) → FemaleAppStack. The app
 *     surfaces her status and gates verified-only actions in-screen.
 *   * Session + male  → MaleTabs.
 *
 * Chat navigator is registered so any post-auth flow can push into it.
 */
function RootNavigator(): React.ReactElement {
  const authed = useIsAuthenticated();
  const role = useSessionRole();

  // A female enters the app regardless of verification status. The app shows
  // her current status (not-verified / under-review / verified) and gates
  // verified-only actions (e.g. going online) in-screen. Admin approval flips
  // her to 'verified' and unlocks those actions on her next status refresh.
  const showFemaleApp = authed && role === UserRole.Female;
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
