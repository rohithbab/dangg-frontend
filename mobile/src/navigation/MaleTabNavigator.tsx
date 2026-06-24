import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Coins, Home, User } from 'lucide-react-native';
import React from 'react';

import FloatingBottomNav from '@core/components/FloatingBottomNav';

import MaleHomeScreen from '@features/maleHome/screens/MaleHomeScreen';
import MaleProfileScreen from '@features/profile/screens/MaleProfileScreen';
import WalletScreen from '@features/wallet/screens/WalletScreen';

import { type MaleTabParamList } from './types';

const Tab = createBottomTabNavigator<MaleTabParamList>();

type IconProps = { color: string; size: number };

const HomeIcon = ({ color, size }: IconProps): React.ReactElement => (
  <Home color={color} size={size} strokeWidth={2} />
);
const CoinsIcon = ({ color, size }: IconProps): React.ReactElement => (
  <Coins color={color} size={size} strokeWidth={2} />
);
const ProfileIcon = ({ color, size }: IconProps): React.ReactElement => (
  <User color={color} size={size} strokeWidth={2} />
);

/**
 * Male post-auth bottom tabs. Order Home → Wallet → Profile, styled by the
 * Neue floating glass pill (labels Home / Coins / Profile).
 */
function MaleTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={props => <FloatingBottomNav {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={MaleHomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: HomeIcon }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ tabBarLabel: 'Coins', tabBarIcon: CoinsIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={MaleProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ProfileIcon }}
      />
    </Tab.Navigator>
  );
}

export default MaleTabNavigator;
