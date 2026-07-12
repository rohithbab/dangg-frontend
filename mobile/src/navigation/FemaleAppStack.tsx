import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ChatsInboxScreen from '@features/chatRequests/screens/ChatsInboxScreen';
import FemaleChatRequestAcceptedScreen from '@features/chatRequests/screens/FemaleChatRequestAcceptedScreen';
import FemaleChatSessionScreen from '@features/chatRequests/screens/FemaleChatSessionScreen';
import NotificationPermissionPrimerScreen from '@features/common/NotificationPermissionPrimerScreen';
import AddBankScreen from '@features/earnings/screens/AddBankScreen';
import AddPayoutMethodScreen from '@features/earnings/screens/AddPayoutMethodScreen';
import AddUpiScreen from '@features/earnings/screens/AddUpiScreen';
import FemaleBankUpiUpdateScreen from '@features/earnings/screens/BankUpiUpdateScreen';
import PayoutDetailScreen from '@features/earnings/screens/PayoutDetailScreen';
import PayoutHistoryScreen from '@features/earnings/screens/PayoutHistoryScreen';
import PayoutInReviewScreen from '@features/earnings/screens/PayoutInReviewScreen';
import PayoutMethodAddedScreen from '@features/earnings/screens/PayoutMethodAddedScreen';
import PayoutMethodsScreen from '@features/earnings/screens/PayoutMethodsScreen';
import PayoutRequestScreen from '@features/earnings/screens/PayoutRequestScreen';
import ReviewWithdrawalScreen from '@features/earnings/screens/ReviewWithdrawalScreen';
import WithdrawAmountScreen from '@features/earnings/screens/WithdrawAmountScreen';
import WithdrawResultScreen from '@features/earnings/screens/WithdrawResultScreen';
import RecentActivityScreen from '@features/femaleHome/screens/RecentActivityScreen';
import NotificationsScreen from '@features/notifications/screens/NotificationsScreen';
import AboutAppScreen from '@features/profile/screens/AboutAppScreen';
import DeleteAccountConfirmScreen from '@features/profile/screens/DeleteAccountConfirmScreen';
import DeleteAccountWarningScreen from '@features/profile/screens/DeleteAccountWarningScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
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
      <Stack.Screen name="ChatsInbox" component={ChatsInboxScreen} />
      <Stack.Screen name="RecentActivity" component={RecentActivityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BankUpiUpdate" component={FemaleBankUpiUpdateScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PayoutRequest" component={PayoutRequestScreen} />
      <Stack.Screen
        name="PayoutInReview"
        component={PayoutInReviewScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="PayoutHistory" component={PayoutHistoryScreen} />
      <Stack.Screen name="PayoutDetail" component={PayoutDetailScreen} />
      <Stack.Screen name="WithdrawAmount" component={WithdrawAmountScreen} />
      <Stack.Screen name="ReviewWithdrawal" component={ReviewWithdrawalScreen} />
      <Stack.Screen
        name="WithdrawResult"
        component={WithdrawResultScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="PayoutMethods" component={PayoutMethodsScreen} />
      <Stack.Screen name="AddPayoutMethod" component={AddPayoutMethodScreen} />
      <Stack.Screen name="AddUpi" component={AddUpiScreen} />
      <Stack.Screen name="AddBank" component={AddBankScreen} />
      <Stack.Screen
        name="PayoutMethodAdded"
        component={PayoutMethodAddedScreen}
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
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default FemaleAppStack;
