import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ChatRequestAcceptedScreen from '@features/chatRequests/screens/ChatRequestAcceptedScreen';
import ChatRequestDeclinedScreen from '@features/chatRequests/screens/ChatRequestDeclinedScreen';
import ChatRequestSentScreen from '@features/chatRequests/screens/ChatRequestSentScreen';
import ChatRequestTimeoutScreen from '@features/chatRequests/screens/ChatRequestTimeoutScreen';
import ChatSessionScreen from '@features/chatRequests/screens/ChatSessionScreen';
import ChatsInboxScreen from '@features/chatRequests/screens/ChatsInboxScreen';
import LikeDislikeRatingScreen from '@features/chatRequests/screens/LikeDislikeRatingScreen';
import NotificationPermissionPrimerScreen from '@features/common/NotificationPermissionPrimerScreen';
import FemaleProfilePreviewScreen from '@features/maleHome/screens/FemaleProfilePreviewScreen';
import NotificationsScreen from '@features/notifications/screens/NotificationsScreen';
import AboutAppScreen from '@features/profile/screens/AboutAppScreen';
import DeleteAccountConfirmScreen from '@features/profile/screens/DeleteAccountConfirmScreen';
import DeleteAccountWarningScreen from '@features/profile/screens/DeleteAccountWarningScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
import HelpSupportScreen from '@features/profile/screens/HelpSupportScreen';
import ReportIssueScreen from '@features/profile/screens/ReportIssueScreen';
import SettingsScreen from '@features/profile/screens/SettingsScreen';
import CoinStoreScreen from '@features/wallet/screens/CoinStoreScreen';
import PaymentFailedScreen from '@features/wallet/screens/PaymentFailedScreen';
import PaymentProcessingScreen from '@features/wallet/screens/PaymentProcessingScreen';
import PaymentSuccessScreen from '@features/wallet/screens/PaymentSuccessScreen';

import MaleTabNavigator from './MaleTabNavigator';
import { type MaleAppStackParamList } from './types';

const Stack = createNativeStackNavigator<MaleAppStackParamList>();

/**
 * Male-side app stack: bottom-tabs as the root, plus push-able secondary
 * screens (Female Profile Preview, chat-request flow, payment flow, and
 * the reused profile-menu screens shared with the female stack).
 */
function MaleAppStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MaleTabs" component={MaleTabNavigator} />
      <Stack.Screen name="ChatsInbox" component={ChatsInboxScreen} />
      <Stack.Screen name="FemaleProfilePreview" component={FemaleProfilePreviewScreen} />
      <Stack.Screen name="ChatRequestSent" component={ChatRequestSentScreen} />
      <Stack.Screen
        name="ChatRequestAccepted"
        component={ChatRequestAcceptedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatSession"
        component={ChatSessionScreen}
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatRequestDeclined"
        component={ChatRequestDeclinedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChatRequestTimeout"
        component={ChatRequestTimeoutScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="CoinStore" component={CoinStoreScreen} />
      <Stack.Screen
        name="PaymentProcessing"
        component={PaymentProcessingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="PaymentFailed"
        component={PaymentFailedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountWarningScreen} />
      <Stack.Screen name="DeleteAccountConfirm" component={DeleteAccountConfirmScreen} />
      <Stack.Screen name="NotificationPermission" component={NotificationPermissionPrimerScreen} />
      <Stack.Screen
        name="LikeDislikeRating"
        component={LikeDislikeRatingScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default MaleAppStack;
