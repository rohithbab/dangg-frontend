import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppColors } from '@theme/colors';

/**
 * Neutral, brand-coloured hold shown for the brief window after a fresh female
 * sign-in while her verification status is being fetched (see
 * `verificationPending` in sessionStore). It replaces what used to be a
 * split-second flash of the "verify your account" screen: `session`/`role` are
 * set synchronously on SIGNED_IN, but the female verification fetch is async, so
 * RootNavigator momentarily couldn't tell "verified" from "not-yet-loaded". This
 * screen is bounded by that fetch completing — never a fixed delay — and carries
 * no auth/verification affordances, so it can't imply the wrong account state.
 */
function AuthResolvingScreen(): React.ReactElement {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={AppColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
});

export default AuthResolvingScreen;
