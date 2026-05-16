import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import BottomNav, { MALE_TABS } from '@core/components/BottomNav';

import { UserRole } from '@app-types/domain';

import PlaceholderScreen from './PlaceholderScreen';
import { type MaleTabParamList } from './types';

const Tab = createBottomTabNavigator<MaleTabParamList>();

/** Male post-auth tabs: Wallet | Home | Profile. */
function MaleTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="MaleHome"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BottomNav
          role={UserRole.Male}
          currentIndex={state.index}
          onTabPress={i => {
            const target = state.routeNames[i];
            if (target) {
              navigation.navigate(target);
            }
          }}
          items={MALE_TABS}
        />
      )}
    >
      <Tab.Screen name="MaleWallet" component={PlaceholderScreen} />
      <Tab.Screen name="MaleHome" component={PlaceholderScreen} />
      <Tab.Screen name="MaleProfile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

export default MaleTabNavigator;
