import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BadgeCheck,
  Bell,
  Camera,
  ChevronRight,
  HelpCircle,
  Info,
  Landmark,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Trash2,
  User,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { InterFont } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import DanggLogo from '@core/components/DanggLogo';
import GradientAvatar from '@core/components/GradientAvatar';
import LogoMark from '@core/components/LogoMark';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { getEarningsBalance } from '@features/earnings/api/earningsApi';

import { type Profile, getProfile, signOut } from '../api/profileApi';
import EditProfilePicSheet from '../components/EditProfilePicSheet';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

const PAD = 24;

type RowProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
};

function Row({
  icon,
  label,
  onPress,
  trailing,
  danger = false,
  last = false,
}: RowProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {trailing ??
        (danger ? null : (
          <ChevronRight size={18} color={AppColors.onSurfaceDisabled} strokeWidth={2} />
        ))}
    </Pressable>
  );
}

function Section({
  label,
  danger = false,
  children,
}: {
  label?: string;
  danger?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.sectionWrap}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={[styles.card, danger && styles.cardDanger]}>{children}</View>
    </View>
  );
}

/**
 * C25 · Female Profile (Neue settings list). Avatar + Edit, an earnings card
 * with Withdraw, and grouped rows: Account / Earnings & payouts / Verification
 * / Preferences / Support + a destructive group. All routes wired to existing
 * screens; logout/avatar logic preserved.
 */
function FemaleProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [availableInr, setAvailableInr] = useState<number | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [p, b] = await Promise.all([getProfile(), getEarningsBalance()]);
      setProfile(p);
      setAvailableInr(b.availableInr);
    } catch (e) {
      logger.error('FemaleProfileScreen.load failed', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleAvatarChanged = useCallback((url: string | null): void => {
    setProfile(prev => (prev ? { ...prev, avatarUrl: url } : prev));
  }, []);

  const handleLogoutConfirm = useCallback(async (): Promise<void> => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      logger.error('FemaleProfileScreen.signOut failed', e);
    } finally {
      setLogoutDialog(false);
      setSigningOut(false);
    }
  }, [signingOut]);

  const mutedIcon = (Icon: typeof User): React.ReactNode => (
    <Icon size={20} color={AppColors.onSurfaceMuted} strokeWidth={1.8} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change photo"
            onPress={() => setEditSheetOpen(true)}
            style={styles.avatarWrap}
          >
            <GradientAvatar
              initials={(profile?.name ?? 'You').slice(0, 1).toUpperCase()}
              seed={profile?.name ?? 'You'}
              uri={profile?.avatarUrl ?? null}
              size={60}
            />
            <View style={styles.cameraBadge}>
              <Camera size={12} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </Pressable>
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.name ?? '—'}
              </Text>
              {profile?.verified ? (
                <BadgeCheck size={16} color={AppColors.featureBlue} strokeWidth={2.2} />
              ) : null}
            </View>
            <Text style={styles.maskedPhone} numberOfLines={1}>
              {profile?.maskedPhone ?? '—'}
            </Text>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.coinCard}>
          <WalletIcon size={22} color={AppColors.primary} strokeWidth={2} />
          <View style={styles.coinBody}>
            <Text style={styles.coinText}>{availableInr != null ? inr(availableInr) : '—'}</Text>
            <Text style={styles.coinSub}>Available to withdraw</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('WithdrawAmount')}
            style={({ pressed }) => [styles.withdrawPill, pressed && styles.pressed]}
          >
            <Text style={styles.withdrawText}>Withdraw</Text>
          </Pressable>
        </View>

        {/* Account */}
        <Section label="ACCOUNT">
          <Row
            icon={mutedIcon(User)}
            label="Personal info"
            onPress={() => navigation.navigate('EditProfile')}
            last
          />
        </Section>

        {/* Earnings & payouts */}
        <Section label="EARNINGS & PAYOUTS">
          <Row
            icon={mutedIcon(WalletIcon)}
            label="Earnings"
            onPress={() => navigation.navigate('FemaleTabs', { screen: 'Earnings' })}
          />
          <Row
            icon={mutedIcon(Landmark)}
            label="Payout details"
            onPress={() => navigation.navigate('PayoutMethods')}
          />
          <Row
            icon={mutedIcon(ReceiptText)}
            label="Payout history"
            onPress={() => navigation.navigate('PayoutHistory')}
            last
          />
        </Section>

        {/* Verification */}
        <Section label="VERIFICATION">
          <Row
            icon={mutedIcon(ShieldCheck)}
            label="Verification"
            onPress={() => undefined}
            last
            trailing={
              <Text
                style={[
                  styles.statusText,
                  { color: profile?.verified ? AppColors.success : AppColors.coinGold },
                ]}
              >
                {profile?.verified ? 'Verified' : 'Pending'}
              </Text>
            }
          />
        </Section>

        {/* Preferences */}
        <Section label="PREFERENCES">
          <Row
            icon={mutedIcon(Bell)}
            label="Notifications"
            onPress={() => navigation.navigate('Settings')}
            last
          />
        </Section>

        {/* Support */}
        <Section label="SUPPORT">
          <Row
            icon={mutedIcon(HelpCircle)}
            label="Help center"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <Row
            icon={mutedIcon(Info)}
            label="About"
            onPress={() => navigation.navigate('AboutApp')}
            last
          />
        </Section>

        {/* Danger */}
        <Section danger>
          <Row
            icon={<LogOut size={20} color={AppColors.error} strokeWidth={1.8} />}
            label="Log out"
            danger
            onPress={() => setLogoutDialog(true)}
          />
          <Row
            icon={<Trash2 size={20} color={AppColors.error} strokeWidth={1.8} />}
            label="Delete account"
            danger
            last
            onPress={() => navigation.navigate('DeleteAccount')}
          />
        </Section>

        <View style={styles.brandFooter}>
          <View style={styles.brandRow}>
            <LogoMark size={18} />
            <DanggLogo width={80} showTagline={false} color={AppColors.onSurface} />
          </View>
          <Text style={styles.brandVersion}>v1.0.0</Text>
        </View>
      </ScrollView>

      <EditProfilePicSheet
        visible={editSheetOpen}
        hasExistingPhoto={profile?.avatarUrl !== null && profile?.avatarUrl !== undefined}
        onClose={() => setEditSheetOpen(false)}
        onAvatarChanged={handleAvatarChanged}
      />

      <ConfirmationDialog
        visible={logoutDialog}
        title="Logout from Dangg?"
        body="You'll need to log in again to access your account."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setLogoutDialog(false)}
        onConfirm={() => {
          void handleLogoutConfirm();
        }}
      />
    </SafeAreaView>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { paddingBottom: BOTTOM_CLEAR, paddingHorizontal: PAD },
  pressed: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20 },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: AppColors.background,
  },
  identity: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: InterFont.medium, fontSize: 18, color: AppColors.onSurface },
  maskedPhone: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },

  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginTop: 24,
  },
  coinBody: { flex: 1 },
  coinText: { fontFamily: InterFont.medium, fontSize: 16, color: AppColors.onSurface },
  coinSub: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  withdrawPill: {
    backgroundColor: AppColors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  withdrawText: { fontFamily: InterFont.semibold, fontSize: 13.5, color: '#FFFFFF' },
  sectionWrap: { marginTop: 22 },
  sectionLabel: {
    fontFamily: InterFont.medium,
    fontSize: 12,
    letterSpacing: 0.72,
    color: AppColors.onSurfaceMuted,
    marginBottom: 10,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  cardDanger: { borderColor: AppColors.errorLight },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AppColors.divider },
  rowPressed: { backgroundColor: AppColors.surfaceVariant },
  rowIcon: { width: 22, alignItems: 'center' },
  rowLabel: { flex: 1, fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurface },
  rowLabelDanger: { fontFamily: InterFont.medium, color: AppColors.error },
  statusText: { fontFamily: InterFont.medium, fontSize: 14 },
  brandFooter: { alignItems: 'center', marginTop: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandVersion: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceDisabled,
    marginTop: 6,
  },
});

export default FemaleProfileScreen;
