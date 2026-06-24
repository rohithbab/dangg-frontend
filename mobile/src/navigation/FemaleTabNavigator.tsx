import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Wallet } from 'lucide-react-native';
import React from 'react';

import FloatingBottomNav from '@core/components/FloatingBottomNav';

import EarningsDashboardScreen from '@features/earnings/screens/EarningsDashboardScreen';
import FemaleHomeScreen from '@features/femaleHome/screens/FemaleHomeScreen';
import FemaleProfileScreen from '@features/profile/screens/FemaleProfileScreen';

import { type FemaleTabParamList } from './types';

const Tab = createBottomTabNavigator<FemaleTabParamList>();

type IconProps = { color: string; size: number };

const HomeIcon = ({ color, size }: IconProps): React.ReactElement => (
  <Home color={color} size={size} strokeWidth={2} />
);
const EarningsIcon = ({ color, size }: IconProps): React.ReactElement => (
  <Wallet color={color} size={size} strokeWidth={2} />
);
const ProfileIcon = ({ color, size }: IconProps): React.ReactElement => (
  <User color={color} size={size} strokeWidth={2} />
);

/**
 * Female post-auth bottom tabs. Order Home → Earnings → Profile, styled by the
 * Neue floating glass pill.
 */
function FemaleTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={props => <FloatingBottomNav {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={FemaleHomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: HomeIcon }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsDashboardScreen}
        options={{ tabBarLabel: 'Earnings', tabBarIcon: EarningsIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={FemaleProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ProfileIcon }}
      />
    </Tab.Navigator>
  );
}

export default FemaleTabNavigator;
