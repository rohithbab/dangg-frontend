import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { useIsOnline } from '@store/connectivityStore';

/**
 * Slim banner pinned to the top when connectivity is lost.
 * Wrap the navigator with this component — auto-hides on reconnect.
 */
function OfflineOverlay({ children }: { children: React.ReactNode }): React.ReactElement {
  const isOnline = useIsOnline();
  return (
    <View style={styles.root}>
      {children}
      {!isOnline ? (
        <SafeAreaView style={styles.banner} pointerEvents="none">
          <View style={styles.bannerInner}>
            <Text style={styles.label}>You&apos;re offline</Text>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.error,
  },
  bannerInner: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    alignItems: 'center',
  },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.onError,
  },
});

export default OfflineOverlay;
