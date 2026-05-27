import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

import FloatingBottomNav from '@core/components/FloatingBottomNav';

import MaleHomeScreen from '@features/maleHome/screens/MaleHomeScreen';
import MaleProfileScreen from '@features/profile/screens/MaleProfileScreen';
import WalletScreen from '@features/wallet/screens/WalletScreen';

import { type MaleTabParamList } from './types';

const Tab = createBottomTabNavigator<MaleTabParamList>();

type IconProps = { color: string; size: number };

function WalletTabIcon({ color, size }: IconProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill={color}
      />
    </Svg>
  );
}

function HomeTabIcon({ color, size }: IconProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
    </Svg>
  );
}

function PersonTabIcon({ color, size }: IconProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Male post-auth bottom tabs.
 *
 * Order declared as Home → Wallet → Profile to match the new bottom-nav design.
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
        options={{ tabBarLabel: 'Home', tabBarIcon: HomeTabIcon }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ tabBarLabel: 'Wallet', tabBarIcon: WalletTabIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={MaleProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: PersonTabIcon }}
      />
    </Tab.Navigator>
  );
}

export default MaleTabNavigator;
