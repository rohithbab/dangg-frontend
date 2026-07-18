import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ChatRequestAcceptedScreen from '@features/chatRequests/screens/ChatRequestAcceptedScreen';
import ChatRequestDeclinedScreen from '@features/chatRequests/screens/ChatRequestDeclinedScreen';
import ChatRequestSentScreen from '@features/chatRequests/screens/ChatRequestSentScreen';
import ChatRequestTimeoutScreen from '@features/chatRequests/screens/ChatRequestTimeoutScreen';

import PlaceholderScreen from './PlaceholderScreen';
import { type ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

/**
 * Chat request flow (Phase 1 only — active chat is Phase 2).
 * Routes mirror Section 2.24–2.29 of `mobile_app_screen_spec.md`.
 */
function ChatNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="ChatRequestSent"
      screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
    >
      <Stack.Screen name="ChatRequestSent" component={ChatRequestSentScreen} />
      <Stack.Screen name="ChatRequestAccepted" component={ChatRequestAcceptedScreen} />
      <Stack.Screen name="ChatRequestDeclined" component={ChatRequestDeclinedScreen} />
      <Stack.Screen name="ChatRequestTimeout" component={ChatRequestTimeoutScreen} />
      <Stack.Screen name="QueuePosition" component={PlaceholderScreen} />
      <Stack.Screen name="LikeDislikeRating" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

export default ChatNavigator;
