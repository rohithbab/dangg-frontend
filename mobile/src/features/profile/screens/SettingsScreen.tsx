import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import { prefsStorage, PrefsKey } from '@core/storage/prefsStorage';

import AvailabilityToggle from '../../femaleHome/components/AvailabilityToggle';

type NotifPrefs = {
  chatRequests: boolean;
  payments: boolean;
  marketing: boolean;
};

const NOTIF_KEYS: Record<keyof NotifPrefs, PrefsKey> = {
  chatRequests: PrefsKey.NotifChatRequests,
  payments: PrefsKey.NotifPayments,
  marketing: PrefsKey.NotifMarketing,
};

function readBoolPref(key: PrefsKey, defaultValue: boolean): boolean {
  return prefsStorage.getBool(key, defaultValue);
}

function writeBoolPref(key: PrefsKey, value: boolean): void {
  prefsStorage.setBool(key, value);
}

/** Settings — notification preference toggles (persisted per category). */
function SettingsScreen(): React.ReactElement {
  const [notif, setNotif] = useState<NotifPrefs>(() => ({
    chatRequests: readBoolPref(NOTIF_KEYS.chatRequests, true),
    payments: readBoolPref(NOTIF_KEYS.payments, true),
    marketing: readBoolPref(NOTIF_KEYS.marketing, false),
  }));

  const toggleNotif = useCallback((key: keyof NotifPrefs): void => {
    setNotif(prev => {
      const next = { ...prev, [key]: !prev[key] };
      writeBoolPref(NOTIF_KEYS[key], next[key]);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.groupLabel}>Notifications</Text>
        <View style={[styles.card, AppShadows.e1]}>
          <ToggleRow
            title="Chat Request Notifications"
            description="Get notified when someone wants to chat"
            value={notif.chatRequests}
            onChange={() => toggleNotif('chatRequests')}
            divider
          />
          <ToggleRow
            title="Payment Notifications"
            description="Get notified when you receive payments"
            value={notif.payments}
            onChange={() => toggleNotif('payments')}
            divider
          />
          <ToggleRow
            title="Marketing Notifications"
            description="News and updates from Dangg"
            value={notif.marketing}
            onChange={() => toggleNotif('marketing')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
  divider?: boolean;
};

function ToggleRow({
  title,
  description,
  value,
  onChange,
  divider = false,
}: ToggleRowProps): React.ReactElement {
  return (
    <View style={[styles.toggleRow, divider && styles.toggleRowDivider]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <AvailabilityToggle value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl },
  groupLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: AppSpacing.md,
    marginBottom: AppSpacing.sm,
    marginHorizontal: AppSpacing.xs,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.md,
    gap: AppSpacing.md,
  },
  toggleRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  toggleText: { flex: 1 },
  toggleTitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  toggleDesc: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
});

export default SettingsScreen;
