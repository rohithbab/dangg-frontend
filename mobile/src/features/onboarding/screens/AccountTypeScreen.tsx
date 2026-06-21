import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import DanggLogo from '@core/components/DanggLogo';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { markOnboardingSeen } from '../../auth/api/authApi';
import AccountTypeCard from '../../auth/components/AccountTypeCard';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AccountType'>;

/**
 * Role-selection screen. First-time users land here after Splash and pick
 * Female or Male — the choice routes them into the appropriate signup
 * flow. Returning users tap "Login" to pop a role-picker bottom sheet.
 *
 * Layout anchors DanggLogo at the top center, places the headlines and selection cards
 * higher up on the screen, and positions the inline footer link at the bottom.
 */
function AccountTypeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const handlePickFemale = useCallback((): void => {
    markOnboardingSeen();
    navigation.navigate('FemaleSignupBasicInfo');
  }, [navigation]);

  const handlePickMale = useCallback((): void => {
    markOnboardingSeen();
    navigation.navigate('MaleSignupBasicInfo');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoHeader}>
          <DanggLogo width={140} showTagline={false} />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.headlineText}>How will you use the app?</Text>
          <Text style={styles.subheadline}>Choose your account type to continue</Text>

          <View style={styles.cards}>
            <AccountTypeCard
              role={UserRole.Female}
              title="I'm a Female"
              subtitle="Chat with users and earn"
              onPress={handlePickFemale}
            />
            <View style={styles.cardGap} />
            <AccountTypeCard
              role={UserRole.Male}
              title="I'm a Male"
              subtitle="Browse and chat with females"
              onPress={handlePickMale}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => navigation.navigate('CommonLogin')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    padding: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  logoHeader: {
    alignItems: 'center',
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.xxl,
    marginRight: AppSpacing.xs,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: AppSpacing.md,
  },
  headlineText: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
    fontWeight: '700',
  },
  subheadline: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
    marginBottom: AppSpacing.xl,
  },
  cards: { marginTop: AppSpacing.xl, gap: AppSpacing.md },
  cardGap: { height: AppSpacing.md },
  footer: {
    alignItems: 'center',
    paddingVertical: AppSpacing.md,
  },
  footerText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  footerLink: {
    ...AppTypography.bodyLarge,
    color: AppColors.primary,
    fontWeight: '700',
  },
});

export default AccountTypeScreen;
