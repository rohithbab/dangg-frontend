import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

import { useSessionStore } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

function WarningIcon(): React.ReactElement {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24">
      <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill={AppColors.error} />
    </Svg>
  );
}

/**
 * Step 1 of the delete-account flow. Plain warning + Cancel/Continue.
 * Continue routes to {@link DeleteAccountConfirmScreen} which performs the
 * actual destructive action.
 */
function DeleteAccountWarningScreen(): React.ReactElement {
  const navigation = useNavigation<{
    navigate: (name: 'DeleteAccountConfirm') => void;
    goBack: () => void;
  }>();
  const role = useSessionStore(s => s.role);
  const isMale = role === UserRole.Male;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Delete account" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconCircle}>
          <WarningIcon />
        </View>

        <Text style={styles.title}>Delete your account?</Text>

        <Text style={styles.body}>
          This is permanent. We’ll remove your profile, chats, ratings, and history. You can’t undo
          this.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Before you continue</Text>
          <BulletRow text="Your earnings and chat history will be removed" />
          {isMale ? (
            <BulletRow text="Any unused coins will be forfeited" />
          ) : (
            <BulletRow text="Pending payouts must be cleared first" />
          )}
          <BulletRow text="Your username can’t be re-used" />
          <BulletRow text="You’ll be signed out of every device" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={() => navigation.navigate('DeleteAccountConfirm')}
        />
        <SecondaryButton label="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

function BulletRow({ text }: { text: string }): React.ReactElement {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    padding: AppSpacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: AppColors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppSpacing.md,
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  body: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    marginTop: AppSpacing.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeading: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginBottom: AppSpacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginTop: 8,
  },
  bulletText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    flex: 1,
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
});

export default DeleteAccountWarningScreen;
