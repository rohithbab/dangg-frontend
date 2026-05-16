import { type RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';

/**
 * Stand-in screen the router resolves to for routes whose concrete screens
 * have not yet been built. Each route registers this screen and labels it
 * by the route's `name` — so the user always sees which screen would be
 * here in production.
 */
function PlaceholderScreen(): React.ReactElement {
  const route = useRoute<RouteProp<Record<string, object | undefined>>>();
  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title={route.name} />
      <View style={styles.body}>
        <Text style={styles.headline}>Coming soon: {route.name}</Text>
        <Text style={styles.body_text}>This screen will be built in a subsequent prompt.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppSpacing.lg,
  },
  headline: { ...AppTypography.titleMedium, textAlign: 'center' },
  body_text: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
