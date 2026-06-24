import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import BottomSheet from '@core/components/BottomSheet';
import CoinIcon from '@core/components/CoinIcon';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { compactNumber } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { useWalletStore } from '@features/wallet/store/walletStore';

import { type Profile, getProfile, signOut, updateProfile } from '../api/profileApi';
import EditProfilePicSheet from '../components/EditProfilePicSheet';
import MenuRow from '../components/MenuRow';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;

function PencilIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill={AppColors.onPrimary}
      />
    </Svg>
  );
}

function BellMenuIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={c}
      />
    </Svg>
  );
}

function HelpIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
        fill={c}
      />
    </Svg>
  );
}

function ReportIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"
        fill={c}
      />
    </Svg>
  );
}

function InfoIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
        fill={c}
      />
    </Svg>
  );
}

function LogoutIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
        fill={c}
      />
    </Svg>
  );
}

function DeleteForeverIcon(c: string): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M6 21h12V7H6v14zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"
        fill={c}
      />
    </Svg>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Male Profile tab. Mirror of FemaleProfileScreen with role-specific
 * differences: no verification badge, no Bank/UPI menu item, stats show
 * "Coins Purchased / Chats / Days Active" rather than the female metrics.
 */
function MaleProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const totalCoinsPurchased = useWalletStore(s => s.totalCoinsPurchased);
  const chatsStarted = useWalletStore(s => s.chatsStarted);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const p = await getProfile();
      setProfile(p);
      setEditName(p.name);
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

  const handleSaveDetails = async (): Promise<void> => {
    if (!editName.trim()) {
      return;
    }
    try {
      await updateProfile({ name: editName });
      setProfile(prev => (prev ? { ...prev, name: editName } : prev));
      setEditDetailsOpen(false);
    } catch (e) {
      logger.error('handleSaveDetails failed', e);
    }
  };

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile picture"
            onPress={() => setEditSheetOpen(true)}
            style={styles.avatarWrap}
          >
            <View style={styles.avatarRing}>
              <Avatar
                uri={profile?.avatarUrl ?? null}
                size={112}
                initials={initialsFromName(profile?.name ?? 'You')}
              />
            </View>
            <View style={styles.editBadge}>
              <PencilIcon />
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name ?? '—'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit name"
              onPress={() => setEditDetailsOpen(true)}
              style={styles.nameEditBtn}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  fill={AppColors.primary}
                />
              </Svg>
            </Pressable>
          </View>
          <Text style={styles.maskedPhone}>{profile?.maskedPhone ?? '—'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statsGridItem, AppShadows.e1]}>
            <CoinIcon size={22} />
            <Text style={styles.statValue}>{compactNumber(totalCoinsPurchased)}</Text>
            <Text style={styles.statLabel}>Purchased</Text>
          </View>
          <View style={[styles.statsGridItem, AppShadows.e1]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                fill={AppColors.primary}
              />
            </Svg>
            <Text style={styles.statValue}>{chatsStarted}</Text>
            <Text style={styles.statLabel}>Chats Started</Text>
          </View>
          <View style={[styles.statsGridItem, AppShadows.e1]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-5-7h-2v2h2v-2z"
                fill={AppColors.warning}
              />
            </Svg>
            <Text style={styles.statValue}>{profile ? String(profile.daysActive) : '—'}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={[styles.statsGridItem, AppShadows.e1]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill={AppColors.success}
              />
            </Svg>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <Text style={styles.groupLabel}>Account</Text>
        <View style={[styles.menuCardShadow, AppShadows.e2]}>
          <View style={styles.menuCardContainer}>
            <MenuRow
              title="Notification Preferences"
              renderIcon={BellMenuIcon}
              onPress={() => navigation.navigate('Settings')}
              last
            />
          </View>
        </View>

        <Text style={styles.groupLabel}>Support</Text>
        <View style={[styles.menuCardShadow, AppShadows.e2]}>
          <View style={styles.menuCardContainer}>
            <MenuRow
              title="Help & Support"
              renderIcon={HelpIcon}
              onPress={() => navigation.navigate('HelpSupport')}
            />
            <MenuRow
              title="Report an Issue"
              renderIcon={ReportIcon}
              onPress={() => navigation.navigate('ReportIssue')}
            />
            <MenuRow
              title="About App"
              renderIcon={InfoIcon}
              onPress={() => navigation.navigate('AboutApp')}
              last
            />
          </View>
        </View>

        <Text style={styles.groupLabel}>Session</Text>
        <View style={[styles.menuCardShadow, AppShadows.e2]}>
          <View style={styles.menuCardContainer}>
            <MenuRow
              title="Logout"
              destructive
              renderIcon={LogoutIcon}
              hideChevron
              onPress={() => setLogoutDialog(true)}
            />
            <MenuRow
              title="Delete Account"
              destructive
              renderIcon={DeleteForeverIcon}
              onPress={() => navigation.navigate('DeleteAccount')}
              last
            />
          </View>
        </View>

        <Text style={styles.footer}>Version 1.0.0 (1)</Text>
      </ScrollView>

      <EditProfilePicSheet
        visible={editSheetOpen}
        hasExistingPhoto={profile?.avatarUrl !== null && profile?.avatarUrl !== undefined}
        onClose={() => setEditSheetOpen(false)}
        onAvatarChanged={handleAvatarChanged}
      />

      <BottomSheet
        visible={editDetailsOpen}
        onClose={() => setEditDetailsOpen(false)}
        title="Edit Profile"
      >
        <View style={styles.editForm}>
          <TextField
            label="Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter your name"
          />
          <View style={styles.editActions}>
            <PrimaryButton label="Save Changes" onPress={handleSaveDetails} />
          </View>
        </View>
      </BottomSheet>

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

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { paddingBottom: BOTTOM_CLEAR },
  heroBlock: {
    alignItems: 'center',
    paddingTop: AppSpacing.xl,
    paddingHorizontal: AppSpacing.lg,
  },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    marginTop: AppSpacing.md,
    paddingLeft: 20, // offset pencil button centering
  },
  name: {
    ...AppTypography.headlineMedium,
    color: AppColors.onSurface,
    fontWeight: '700',
  },
  nameEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedPhone: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  // Rich Stats Grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  statsGridItem: {
    width: '48%',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  groupLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: AppSpacing.lg,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  menuCardShadow: {
    marginHorizontal: AppSpacing.md,
    borderRadius: AppRadii.lg,
  },
  menuCardContainer: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
    borderWidth: 0,
  },
  footer: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xl,
  },
  // Edit Form Sheet
  editForm: {
    gap: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  editActions: {
    marginTop: AppSpacing.sm,
  },
});

export default MaleProfileScreen;
