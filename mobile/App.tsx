/**
 * Dangg root component.
 *
 * Boot sequence:
 *  1. Initialise Supabase (mandatory — the singleton client backs every
 *     repository, even in dev mode).
 *  2. Subscribe Supabase auth changes to `sessionStore`.
 *  3. Subscribe NetInfo connectivity to `connectivityStore`.
 *  4. Initialise FCM (opt-in via ENABLE_FIREBASE — failures are non-fatal).
 *  5. Lock orientation to portrait.
 *  6. Render the navigation root, wrapped in OfflineOverlay.
 */
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppColors, setThemeScheme } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { initSupabase } from '@core/network/supabaseClient';
import { connectivityService } from '@core/services/connectivityService';
import { fcmService } from '@core/services/fcmService';
import { logger } from '@core/utils/logger';

import { linking } from '@navigation/linking';
import { navigationRef } from '@navigation/navigationRef';
import RootNavigator from '@navigation/RootNavigator';

import { useConnectivityStore } from '@store/connectivityStore';
import { subscribeSupabaseAuth } from '@store/sessionStore';

import IncomingChatRequestListener from '@features/chatRequests/components/IncomingChatRequestListener';
import IncomingChatRequestModal from '@features/chatRequests/components/IncomingChatRequestModal';
import OfflineOverlay from '@features/common/OfflineOverlay';

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AppColors.primary,
    background: '#1C1C1C',
    card: '#242424',
    text: '#FFFFFF',
    border: '#3A3A3A',
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: AppColors.primary,
    background: '#1C1C1C',
    card: '#242424',
    text: '#FFFFFF',
    border: '#3A3A3A',
  },
};

function App(): React.JSX.Element {
  setThemeScheme('dark');
  const isDark = true;

  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const client = initSupabase();
      const sub = subscribeSupabaseAuth(client);

      const stopNet = connectivityService.subscribe(isOnline => {
        useConnectivityStore.getState().setOnline(isOnline);
      });
      void connectivityService.currentStatus().then(isOnline => {
        useConnectivityStore.getState().setOnline(isOnline);
      });

      void fcmService.init({
        onForeground: message => logger.debug('FCM foreground', message.messageId),
        onOpenedFromBackground: message => logger.debug('FCM tap', message.messageId),
      });

      return () => {
        sub.unsubscribe();
        stopNet();
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error('Boot failed', message);
      setBootError(message);
      return () => undefined;
    }
  }, []);

  // Orientation lock is enforced natively:
  //   * Android: `android:screenOrientation="portrait"` on MainActivity.
  //   * iOS:    `UISupportedInterfaceOrientations` in Info.plist.
  // No JS-side lock needed — keeps the dep tree small.

  if (bootError) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Dangg failed to start</Text>
            <Text style={styles.errorBody}>{bootError}</Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <OfflineOverlay>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
            theme={isDark ? MyDarkTheme : MyLightTheme}
          >
            <RootNavigator />
            <IncomingChatRequestListener />
            <IncomingChatRequestModal />
          </NavigationContainer>
        </OfflineOverlay>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppSpacing.lg,
    backgroundColor: AppColors.background,
  },
  errorTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.error,
    textAlign: 'center',
  },
  errorBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
});

export default App;
