import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import FeatureCard from '@core/components/FeatureCard';
import LogoMark from '@core/components/LogoMark';
import PrimaryButton from '@core/components/PrimaryButton';

import { type AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AccountType'>;

/**
 * Welcome / account-type screen — "DANGG · Neue".
 *
 * Marketing hero + three feature tiles + a single "Get started" CTA into the
 * signup flow (Phone → OTP → Profile, where role is chosen). Returning users
 * tap "Log in".
 */
function AccountTypeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const handleGetStarted = useCallback((): void => {
    navigation.navigate('SignupPhone');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.wordmarkRow}>
          <LogoMark size={28} />
          <Text style={styles.wordmark}>Dangg</Text>
        </View>

        <Text style={styles.hero}>Real talk.{'\n'}Real connection.</Text>
        <Text style={styles.subtitle}>
          Verified people. Private, text-only chats. You only spend on conversations that matter.
        </Text>

        <View style={styles.cards}>
          <FeatureCard
            tint={AppColors.featureGreen}
            icon={<ShieldCheck size={22} color="#FFFFFF" strokeWidth={2} />}
            title="Verified profiles"
            subtitle="Every woman is ID-verified before she can chat."
          />
          <FeatureCard
            tint={AppColors.featureMauve}
            icon={<Lock size={22} color="#FFFFFF" strokeWidth={2} />}
            title="Private & text-only"
            subtitle="No numbers shared — conversations stay in-app."
          />
          <FeatureCard
            tint={AppColors.featureBlue}
            icon={<Sparkles size={22} color="#FFFFFF" strokeWidth={2} />}
            title="Pay per chat"
            subtitle="Spend only on conversations that actually click."
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <PrimaryButton label="Get started" variant="white" onPress={handleGetStarted} />
        </View>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('LoginPhone')}>
            Log in
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.lg,
    flexGrow: 1,
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: AppSpacing.sm },
  wordmark: {
    fontFamily: InterFont.regular,
    fontSize: 19,
    color: AppColors.onSurface,
    letterSpacing: -0.38,
  },
  hero: {
    fontFamily: InterFont.light,
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -0.9,
    color: AppColors.onSurface,
    marginTop: 56,
  },
  subtitle: {
    fontFamily: InterFont.light,
    fontSize: 15.5,
    lineHeight: 23,
    color: '#8F8F96',
    marginTop: AppSpacing.md,
  },
  cards: { gap: 14, marginTop: AppSpacing.xl },
  spacer: { flex: 1, minHeight: AppSpacing.xl },
  actions: { marginTop: AppSpacing.lg },
  footerText: {
    fontFamily: InterFont.light,
    fontSize: 14.5,
    color: '#8C8C94',
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  footerLink: {
    fontFamily: InterFont.medium,
    fontSize: 14.5,
    color: AppColors.primary,
  },
});

export default AccountTypeScreen;
