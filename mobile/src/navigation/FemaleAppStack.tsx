import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import FemaleChatRequestAcceptedScreen from '@features/chatRequests/screens/FemaleChatRequestAcceptedScreen';
import FemaleChatSessionScreen from '@features/chatRequests/screens/FemaleChatSessionScreen';
import NotificationPermissionPrimerScreen from '@features/common/NotificationPermissionPrimerScreen';
import FemaleBankUpiUpdateScreen from '@features/earnings/screens/BankUpiUpdateScreen';
import PayoutInReviewScreen from '@features/earnings/screens/PayoutInReviewScreen';
import PayoutRequestScreen from '@features/earnings/screens/PayoutRequestScreen';
import NotificationsScreen from '@features/notifications/screens/NotificationsScreen';
import AboutAppScreen from '@features/profile/screens/AboutAppScreen';
import ChangePasswordScreen from '@features/profile/screens/ChangePasswordScreen';
import DeleteAccountConfirmScreen from '@features/profile/screens/DeleteAccountConfirmScreen';
import DeleteAccountWarningScreen from '@features/profile/screens/DeleteAccountWarningScreen';
import HelpSupportScreen from '@features/profile/screens/HelpSupportScreen';
import ReportIssueScreen from '@features/profile/screens/ReportIssueScreen';
import SettingsScreen from '@features/profile/screens/SettingsScreen';

import FemaleTabNavigator from './FemaleTabNavigator';
import { type FemaleAppStackParamList } from './types';

const Stack = createNativeStackNavigator<FemaleAppStackParamList>();

/**
 * Female-side app stack: the bottom-tabs as root + push-able secondary
 * screens. Pushing one of the secondary routes hides the floating bottom
 * nav (because the tab navigator is one level deeper in the stack).
 */
function FemaleAppStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="FemaleTabs" component={FemaleTabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BankUpiUpdate" component={FemaleBankUpiUpdateScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PayoutRequest" component={PayoutRequestScreen} />
      <Stack.Screen
        name="PayoutInReview"
        component={PayoutInReviewScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountWarningScreen} />
      <Stack.Screen name="DeleteAccountConfirm" component={DeleteAccountConfirmScreen} />
      <Stack.Screen name="NotificationPermission" component={NotificationPermissionPrimerScreen} />
      <Stack.Screen
        name="ChatRequestAccepted"
        component={FemaleChatRequestAcceptedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatSession"
        component={FemaleChatSessionScreen}
        options={{ animation: 'slide_from_left', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default FemaleAppStack;
