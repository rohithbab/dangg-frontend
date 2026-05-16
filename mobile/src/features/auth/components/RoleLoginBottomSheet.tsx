import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSpacing } from '@theme/spacing';

import BottomSheet from '@core/components/BottomSheet';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

import { UserRole } from '@app-types/domain';

export type RoleLoginBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (role: UserRole.Female | UserRole.Male) => void;
};

/**
 * Bottom sheet shown when an existing user taps "Login" from the
 * account-type screen (or any signup screen footer). Two large CTAs route
 * to the role-specific login flow.
 */
function RoleLoginBottomSheet({
  visible,
  onClose,
  onPick,
}: RoleLoginBottomSheetProps): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Continue as">
      <View style={styles.body}>
        <PrimaryButton
          label="Login as Female"
          onPress={() => {
            onPick(UserRole.Female);
            onClose();
          }}
        />
        <View style={styles.gap} />
        <SecondaryButton
          label="Login as Male"
          onPress={() => {
            onPick(UserRole.Male);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: AppSpacing.sm },
  gap: { height: AppSpacing.md },
});

export default RoleLoginBottomSheet;
