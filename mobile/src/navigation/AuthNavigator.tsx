import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import PlaceholderScreen from './PlaceholderScreen';
import { type AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth + onboarding stack. Every screen currently resolves to
 * `PlaceholderScreen` — feature implementations will replace them in the
 * next prompt. Routes mirror the spec under
 * [`mobile_app_screen_spec.md`](../../../mobile_app_screen_spec.md).
 */
function AuthNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Splash" component={PlaceholderScreen} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="AccountType"
        component={PlaceholderScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="MaleOnboardingCarousel" component={PlaceholderScreen} />

      <Stack.Screen name="FemaleSignupBasicInfo" component={PlaceholderScreen} />
      <Stack.Screen name="FemaleSignupOtp" component={PlaceholderScreen} />
      <Stack.Screen name="FemaleSignupBankUpi" component={PlaceholderScreen} />
      <Stack.Screen name="FemaleSignupVerificationInfo" component={PlaceholderScreen} />
      <Stack.Screen name="FemaleSignupFaceCapture" component={PlaceholderScreen} />
      <Stack.Screen
        name="FemaleSignupVerificationSubmitted"
        component={PlaceholderScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      <Stack.Screen name="MaleSignupBasicInfo" component={PlaceholderScreen} />
      <Stack.Screen name="MaleSignupOtp" component={PlaceholderScreen} />

      <Stack.Screen name="FemaleLoginPhone" component={PlaceholderScreen} />
      <Stack.Screen name="FemaleLoginPassword" component={PlaceholderScreen} />
      <Stack.Screen name="MaleLogin" component={PlaceholderScreen} />

      <Stack.Screen name="ForgotPasswordPhone" component={PlaceholderScreen} />
      <Stack.Screen name="ForgotPasswordOtp" component={PlaceholderScreen} />
      <Stack.Screen
        name="ForgotPasswordNew"
        component={PlaceholderScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
