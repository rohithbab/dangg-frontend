import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import BottomNav, { FEMALE_TABS } from '@core/components/BottomNav';

import { UserRole } from '@app-types/domain';

import PlaceholderScreen from './PlaceholderScreen';
import { type FemaleTabParamList } from './types';

const Tab = createBottomTabNavigator<FemaleTabParamList>();

/** Female post-auth tabs: Home | Earnings | Profile. */
function FemaleTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="FemaleHome"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BottomNav
          role={UserRole.Female}
          currentIndex={state.index}
          onTabPress={i => {
            const target = state.routeNames[i];
            if (target) {
              navigation.navigate(target);
            }
          }}
          items={FEMALE_TABS}
        />
      )}
    >
      <Tab.Screen name="FemaleHome" component={PlaceholderScreen} />
      <Tab.Screen name="FemaleEarnings" component={PlaceholderScreen} />
      <Tab.Screen name="FemaleProfile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

export default FemaleTabNavigator;
