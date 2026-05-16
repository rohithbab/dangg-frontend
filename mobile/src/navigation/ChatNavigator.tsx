import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

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
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="ChatRequestSent" component={PlaceholderScreen} />
      <Stack.Screen name="ChatRequestAccepted" component={PlaceholderScreen} />
      <Stack.Screen name="ChatRequestDeclined" component={PlaceholderScreen} />
      <Stack.Screen name="ChatRequestTimeout" component={PlaceholderScreen} />
      <Stack.Screen name="QueuePosition" component={PlaceholderScreen} />
      <Stack.Screen name="LikeDislikeRating" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

export default ChatNavigator;
