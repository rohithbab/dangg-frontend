import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale } from '@theme/responsive';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import { APP_NAME } from '@core/config/constants';

import { type PolicyId, POLICIES } from '@features/legal/content/policies.generated';

import MenuRow from '../components/MenuRow';

/** Local nav typing — AboutApp is registered in both the Male and Female
 *  stacks, and both expose `PolicyViewer` with the same param shape. */
type PolicyNav = NativeStackNavigationProp<{ PolicyViewer: { policyId: PolicyId } }>;

function DescriptionIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
        fill={c}
      />
    </Svg>
  );
}

/** About page — logo, version, and the full set of legal policies (in-app). */
function AboutAppScreen(): React.ReactElement {
  const navigation = useNavigation<PolicyNav>();

  const openPolicy = useCallback(
    (policyId: PolicyId): void => {
      navigation.navigate('PolicyViewer', { policyId });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="About" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Version 1.0.0 (1)</Text>
        </View>

        <Text style={styles.sectionLabel}>Legal & Policies</Text>
        <View style={[styles.menuCard, AppShadows.e1]}>
          {POLICIES.map((policy, i) => (
            <MenuRow
              key={policy.id}
              title={policy.title}
              renderIcon={DescriptionIcon}
              onPress={() => openPolicy(policy.id)}
              last={i === POLICIES.length - 1}
            />
          ))}
        </View>

        <Text style={styles.tagline}>Made with love in India</Text>
        <Text style={styles.copyright}>© 2026 Dangg. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl },
  hero: { alignItems: 'center', marginTop: AppSpacing.lg, marginBottom: AppSpacing.xl },
  logo: {
    width: 96,
    height: 96,
    borderRadius: AppRadii.lg,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    ...AppTypography.displayLarge,
    color: AppColors.onPrimary,
  },
  appName: {
    ...AppTypography.displayLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  version: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: moderateScale(4),
  },
  sectionLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    marginBottom: AppSpacing.sm,
    marginLeft: moderateScale(4),
  },
  menuCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
    marginBottom: AppSpacing.lg,
  },
  tagline: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  copyright: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default AboutAppScreen;
