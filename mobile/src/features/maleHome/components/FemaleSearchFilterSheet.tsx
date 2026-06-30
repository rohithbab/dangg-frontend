import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

import AvailabilityToggle from '@features/femaleHome/components/AvailabilityToggle';

import { type FemaleFilters, useFemaleFiltersStore } from '../store/femaleFiltersStore';

export type FemaleSearchFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Filter sheet for the Male Home browse grid. The only filter is "Show only
 * online" — edited locally until Apply, then a single `applyAll` write updates
 * the grid. The other filter fields are carried through untouched.
 */
function FemaleSearchFilterSheet({
  visible,
  onClose,
}: FemaleSearchFilterSheetProps): React.ReactElement {
  const current = useFemaleFiltersStore();
  const apply = useFemaleFiltersStore(s => s.applyAll);
  const resetStore = useFemaleFiltersStore(s => s.reset);

  // Local mirror of the filter state, edited until Apply. Only `onlineOnly` is
  // user-editable now; the rest are passed through as-is.
  const [draft, setDraft] = useState<FemaleFilters>({
    quick: current.quick,
    onlineOnly: current.onlineOnly,
    ageMin: current.ageMin,
    ageMax: current.ageMax,
    rating: current.rating,
    price: current.price,
    sortBy: current.sortBy,
  });

  const handleApply = (): void => {
    apply(draft);
    onClose();
  };

  const handleReset = (): void => {
    resetStore();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Online status</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show only online</Text>
          <AvailabilityToggle
            value={draft.onlineOnly}
            onValueChange={v => setDraft(d => ({ ...d, onlineOnly: v }))}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <SecondaryButton label="Reset" onPress={handleReset} />
        </View>
        <View style={styles.actionHalf}>
          <PrimaryButton label="Apply" onPress={handleApply} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: AppSpacing.md },
  sectionTitle: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: AppSpacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AppSpacing.xs,
  },
  toggleLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.sm,
    paddingTop: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
  actionHalf: { flex: 1 },
});

export default FemaleSearchFilterSheet;
