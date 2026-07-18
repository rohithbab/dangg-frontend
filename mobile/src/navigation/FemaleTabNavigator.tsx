import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Wallet } from 'lucide-react-native';
import React from 'react';

import FloatingBottomNav from '@core/components/FloatingBottomNav';
import SwipeableTabScreen from '@core/components/SwipeableTabScreen';

import EarningsDashboardScreen from '@features/earnings/screens/EarningsDashboardScreen';
import FemaleHomeScreen from '@features/femaleHome/screens/FemaleHomeScreen';
import FemaleProfileScreen from '@features/profile/screens/FemaleProfileScreen';

import { type FemaleTabParamList } from './types';

const Tab = createBottomTabNavigator<FemaleTabParamList>();

const TAB_ORDER = ['Home', 'Earnings', 'Profile'] as const;

function HomeTabScreen(): React.ReactElement {
  return (
    <SwipeableTabScreen order={TAB_ORDER} routeName="Home">
      <FemaleHomeScreen />
    </SwipeableTabScreen>
  );
}

function EarningsTabScreen(): React.ReactElement {
  return (
    <SwipeableTabScreen order={TAB_ORDER} routeName="Earnings">
      <EarningsDashboardScreen />
    </SwipeableTabScreen>
  );
}

function ProfileTabScreen(): React.ReactElement {
  return (
    <SwipeableTabScreen order={TAB_ORDER} routeName="Profile">
      <FemaleProfileScreen />
    </SwipeableTabScreen>
  );
}

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
        component={HomeTabScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: HomeIcon }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsTabScreen}
        options={{ tabBarLabel: 'Earnings', tabBarIcon: EarningsIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ProfileIcon }}
      />
    </Tab.Navigator>
  );
}

export default FemaleTabNavigator;
