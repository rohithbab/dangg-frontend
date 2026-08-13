import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { APP_NAME } from '@core/config/constants';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { recordPolicyAcceptance } from '../api/legalApi';
import { type PolicyId, POLICIES } from '../content/policies.generated';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/** The consent sentence, as text runs with the policy names woven in as links. */
const AGREEMENT_LEAD =
  'I confirm that I am 18 years of age or older and have read, understood, and agree to the ';
const AGREEMENT_TAIL =
  ' of Dangg. I consent to the collection and processing of my information in accordance with the Privacy Policy and agree to comply with all applicable policies while using the platform.';

/**
 * Policy consent gate — shown after OTP verification and before profile
 * creation (Phone → OTP → **Consent** → Profile).
 *
 * The user must tick a single checkbox agreeing to the whole policy bundle;
 * each policy name is individually tappable and opens the document in-app. The
 * "Create My Account" button stays disabled until the box is ticked, and on tap
 * we persist the acceptance (version + timestamp + user + app version) before
 * moving on.
 */
function PolicyConsentScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPolicy = useCallback(
    (policyId: PolicyId): void => {
      navigation.navigate('PolicyViewer', { policyId });
    },
    [navigation],
  );

  const handleCreate = useCallback(async (): Promise<void> => {
    if (!agreed || submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await recordPolicyAcceptance();
      navigation.reset({ index: 0, routes: [{ name: 'SignupProfile' }] });
    } catch (e) {
      if (e instanceof AppException) {
        setError(e.message);
      } else {
        logger.error('PolicyConsentScreen.record failed', e);
        setError("Couldn't save your consent. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }, [agreed, navigation, submitting]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Before you continue</Text>
        <Text style={styles.title}>Welcome to{'\n'}{APP_NAME}</Text>

        <Text style={styles.body}>
          {APP_NAME} is a dating and friendship platform developed by Spark AI and owned, operated,
          and published by WelBuilt AI Solutions Pvt. Ltd.
        </Text>
        <Text style={styles.body}>
          Your privacy, safety, and trust are important to us. Before creating your account, please
          take a moment to review our policies. These documents explain how we collect and use your
          information, your rights and responsibilities, how our platform operates, and the standards
          we expect from every member of the {APP_NAME} community.
        </Text>

        <Text style={styles.sectionTitle}>User Agreement</Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => {
            setAgreed(v => !v);
            setError(null);
          }}
          style={styles.agreeRow}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
            {agreed ? <Check size={moderateScale(16)} color={AppColors.onPrimary} strokeWidth={3} /> : null}
          </View>

          <Text style={styles.agreeText}>
            {AGREEMENT_LEAD}
            {POLICIES.map((p, i) => {
              const isLast = i === POLICIES.length - 1;
              return (
                <Text key={p.id}>
                  <Text style={styles.link} onPress={() => openPolicy(p.id)}>
                    {p.title}
                  </Text>
                  {isLast ? '' : i === POLICIES.length - 2 ? ', and ' : ', '}
                </Text>
              );
            })}
            {AGREEMENT_TAIL}
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.ctaWrap}>
        <PrimaryButton
          label="Create My Account"
          variant="filled"
          disabled={!agreed}
          loading={submitting}
          onPress={() => {
            void handleCreate();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
  },
  eyebrow: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(13),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: AppColors.primary,
    marginBottom: AppSpacing.xs,
  },
  title: {
    fontFamily: InterFont.light,
    fontSize: scaleFont(33),
    lineHeight: scaleFont(40),
    letterSpacing: -0.825,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  body: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(23),
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.md,
  },
  sectionTitle: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(18),
    lineHeight: scaleFont(24),
    color: AppColors.onSurface,
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.md,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(7),
    borderWidth: 2,
    borderColor: AppColors.onSurfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(1),
  },
  checkboxOn: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  agreeText: {
    flex: 1,
    fontFamily: InterFont.regular,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(22),
    color: AppColors.onSurfaceMuted,
  },
  link: {
    fontFamily: InterFont.medium,
    color: AppColors.primary,
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    color: AppColors.error,
    marginTop: AppSpacing.md,
  },
  ctaWrap: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
});

export default PolicyConsentScreen;
