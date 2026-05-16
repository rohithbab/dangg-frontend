import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type PaginationLoaderProps = {
  isLoading: boolean;
  hasMore: boolean;
  endLabel?: string;
};

/** Bottom-of-list indicator for infinite scroll: spinner OR "no more". */
function PaginationLoader({
  isLoading,
  hasMore,
  endLabel = "You're all caught up",
}: PaginationLoaderProps): React.ReactElement {
  if (isLoading) {
    return (
      <View style={styles.row}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }
  if (!hasMore) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{endLabel}</Text>
      </View>
    );
  }
  return <View style={styles.empty} />;
}

const styles = StyleSheet.create({
  row: { paddingVertical: AppSpacing.md, alignItems: 'center' },
  empty: { height: 0 },
  label: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
  },
});

export default PaginationLoader;
