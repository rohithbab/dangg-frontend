import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { APP_NAME } from '@core/config/constants';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { markOnboardingSeen } from '../../auth/api/authApi';
import AccountTypeCard from '../../auth/components/AccountTypeCard';
import RoleLoginBottomSheet from '../../auth/components/RoleLoginBottomSheet';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AccountType'>;

/**
 * Role-selection screen. First-time users land here after Splash and pick
 * Female or Male — the choice routes them into the appropriate signup
 * flow. Returning users tap "Login" to pop a role-picker bottom sheet.
 */
function AccountTypeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const handlePickFemale = useCallback((): void => {
    markOnboardingSeen();
    navigation.navigate('FemaleSignupBasicInfo');
  }, [navigation]);

  const handlePickMale = useCallback((): void => {
    markOnboardingSeen();
    navigation.navigate('MaleSignupBasicInfo');
  }, [navigation]);

  const handleLoginPick = useCallback(
    (role: UserRole.Female | UserRole.Male): void => {
      if (role === UserRole.Female) {
        navigation.navigate('FemaleLoginPhone');
      } else {
        navigation.navigate('MaleLogin');
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.background}
        translucent={false}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoLetter}>D</Text>
          </View>
          <Text style={styles.brandWordmark}>{APP_NAME}</Text>
        </View>

        <Text style={styles.headline}>How will you use Dangg?</Text>
        <Text style={styles.subheadline}>Choose your account type to continue</Text>

        <View style={styles.cards}>
          <AccountTypeCard
            role={UserRole.Female}
            title="I'm a Female"
            subtitle="Chat with users and earn"
            iconGlyph="F"
            onPress={handlePickFemale}
          />
          <View style={styles.cardGap} />
          <AccountTypeCard
            role={UserRole.Male}
            title="I'm a Male"
            subtitle="Browse and chat with females"
            iconGlyph="M"
            onPress={handlePickMale}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Pressable accessibilityRole="link" onPress={() => setLoginSheetOpen(true)} hitSlop={8}>
              <Text style={styles.footerLink}>Login</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>

      <RoleLoginBottomSheet
        visible={loginSheetOpen}
        onClose={() => setLoginSheetOpen(false)}
        onPick={handleLoginPick}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    padding: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppSpacing.lg,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: AppRadii.md,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoLetter: {
    ...AppTypography.headlineMedium,
    color: AppColors.onPrimary,
  },
  brandWordmark: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    marginLeft: AppSpacing.sm,
  },
  headline: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.xl + AppSpacing.sm,
  },
  subheadline: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  cards: { marginTop: AppSpacing.xl, gap: AppSpacing.md },
  cardGap: { height: AppSpacing.md },
  spacer: { flex: 1 },
  footer: {
    alignItems: 'center',
    paddingVertical: AppSpacing.md,
  },
  footerText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  footerLink: {
    ...AppTypography.bodyMedium,
    color: AppColors.primary,
    fontWeight: '600',
  },
});

export default AccountTypeScreen;
