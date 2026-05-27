import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { permissionService } from '@core/services/permissionService';
import { logger } from '@core/utils/logger';

function BellIcon(): React.ReactElement {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={AppColors.primary}
      />
      <Circle cx={18} cy={6} r={3} fill={AppColors.error} />
    </Svg>
  );
}

const BENEFITS: ReadonlyArray<{ icon: string; label: string }> = [
  { icon: '💬', label: 'Chat requests as they come in' },
  { icon: '💰', label: 'Payment & payout updates' },
  { icon: '✅', label: 'Verification status changes' },
];

/**
 * In-app primer shown before the native OS notification dialog. Explains
 * what we’ll send so the user is more likely to accept; "Enable" triggers
 * the platform permission request and routes back regardless of outcome.
 */
function NotificationPermissionPrimerScreen(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [busy, setBusy] = useState(false);

  const pulse = useSharedValue(1);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleEnable = useCallback(async (): Promise<void> => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await permissionService.requestNotifications();
    } catch (e) {
      logger.warn('requestNotifications failed', e);
    } finally {
      setBusy(false);
      navigation.goBack();
    }
  }, [busy, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View style={[styles.iconCircle, pulseStyle]}>
          <BellIcon />
        </Animated.View>

        <Text style={styles.title}>Stay in the loop</Text>
        <Text style={styles.subtitle}>Turn on notifications so you don’t miss what matters.</Text>

        <View style={styles.list}>
          {BENEFITS.map(item => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <Text style={styles.rowText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Enable Notifications"
          onPress={() => {
            void handleEnable();
          }}
          loading={busy}
        />
        <SecondaryButton label="Maybe later" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  list: {
    alignSelf: 'stretch',
    marginTop: AppSpacing.xl,
    gap: AppSpacing.sm,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
  },
  rowIcon: { fontSize: 22 },
  rowText: {
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

export default NotificationPermissionPrimerScreen;
