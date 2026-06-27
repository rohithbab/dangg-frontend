import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Camera,
  ChevronRight,
  Coins,
  HelpCircle,
  Info,
  LogOut,
  ShieldAlert,
  Trash2,
  User,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import GradientAvatar from '@core/components/GradientAvatar';
import LogoMark from '@core/components/LogoMark';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { useWalletStore } from '@features/wallet/store/walletStore';

import { type Profile, getProfile, signOut } from '../api/profileApi';
import EditProfilePicSheet from '../components/EditProfilePicSheet';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;

const PAD = 24;

type RowProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
};

function Row({ icon, label, onPress, danger = false, last = false }: RowProps): React.ReactElement {
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
      {danger ? null : (
        <ChevronRight size={18} color={AppColors.onSurfaceDisabled} strokeWidth={2} />
      )}
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
 * Male Profile tab — Neue account hub (modelled on the "B13 · Settings" frame):
 * gradient avatar + Edit, a coins card that opens the Coin Store, grouped
 * hairline cards (Account / Coins & payments / Support), and a destructive
 * card for logout + delete. All routes and the edit/logout logic are preserved.
 */
function MaleProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useWalletStore(s => s.coinBalance);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const p = await getProfile();
      setProfile(p);
    } catch (e) {
      logger.error('MaleProfileScreen.load failed', e);
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
      logger.error('MaleProfileScreen.signOut failed', e);
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
              initials={profile?.name ?? 'You'}
              seed={profile?.name ?? 'You'}
              uri={profile?.avatarUrl ?? null}
              size={60}
              shape="squircle"
            />
            <View style={styles.cameraBadge}>
              <Camera size={12} color={AppColors.onPrimary} strokeWidth={2.2} />
            </View>
          </Pressable>
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.name ?? '—'}
            </Text>
            <Text style={styles.maskedPhone} numberOfLines={1}>
              {profile?.maskedPhone ?? '—'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
          >
            <Text style={styles.editPillText}>Edit</Text>
          </Pressable>
        </View>

        {/* Coins */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buy coins"
          onPress={() => navigation.navigate('CoinStore')}
          style={({ pressed }) => [styles.coinCard, pressed && styles.pressed]}
        >
          <CoinIcon size={22} />
          <Text style={styles.coinText}>{`${coinBalance.toLocaleString()} coins`}</Text>
          <Text style={styles.addCoins}>Add coins</Text>
        </Pressable>

        {/* Account */}
        <Section label="ACCOUNT">
          <Row
            icon={mutedIcon(User)}
            label="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Row
            icon={mutedIcon(Bell)}
            label="Notifications"
            onPress={() => navigation.navigate('Settings')}
            last
          />
        </Section>

        {/* Coins & payments */}
        <Section label="COINS & PAYMENTS">
          <Row
            icon={mutedIcon(Coins)}
            label="Buy coins"
            onPress={() => navigation.navigate('CoinStore')}
          />
          <Row
            icon={mutedIcon(WalletIcon)}
            label="Wallet & transactions"
            onPress={() => navigation.navigate('MaleTabs', { screen: 'Wallet' })}
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
            icon={mutedIcon(ShieldAlert)}
            label="Report an issue"
            onPress={() => navigation.navigate('ReportIssue')}
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
            <LogoMark size={20} />
            <Text style={styles.brandWord}>Dangg</Text>
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

  // Identity
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
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
  name: { fontFamily: InterFont.medium, fontSize: 18, color: AppColors.onSurface },
  maskedPhone: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  editPill: {
    height: 34,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPillText: { fontFamily: InterFont.medium, fontSize: 13.5, color: AppColors.onSurface },

  // Coins
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginTop: 24,
  },
  coinText: { flex: 1, fontFamily: InterFont.medium, fontSize: 16, color: AppColors.onSurface },
  addCoins: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.primary },

  // Sections
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

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: 15,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  rowPressed: { backgroundColor: AppColors.surfaceVariant },
  rowIcon: { width: 22, alignItems: 'center' },
  rowLabel: { flex: 1, fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurface },
  rowLabelDanger: { fontFamily: InterFont.medium, color: AppColors.error },

  brandFooter: { alignItems: 'center', marginTop: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandWord: {
    fontFamily: InterFont.regular,
    fontSize: 18,
    color: AppColors.onSurface,
    letterSpacing: -0.36,
  },
  brandVersion: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceDisabled,
    marginTop: 6,
  },
});

export default MaleProfileScreen;
