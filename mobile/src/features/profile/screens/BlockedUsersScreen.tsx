import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import GradientAvatar from '@core/components/GradientAvatar';
import Toast from '@core/components/Toast';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type BlockedUser, getBlockedUsers, unblockUser } from '@features/blockReport/api/blockReportApi';

/** Account → Blocked users. Lists everyone the caller has blocked and lets them
 *  unblock — the only way back once blocked users are hidden from browse. */
function BlockedUsersScreen(): React.ReactElement {
  const [users, setUsers] = useState<BlockedUser[] | null>(null); // null = loading
  const [notice, setNotice] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setUsers(await getBlockedUsers());
    } catch (e) {
      logger.warn('getBlockedUsers failed', e);
      setUsers([]);
      setNotice("Couldn't load blocked users.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUnblock = useCallback(
    async (user: BlockedUser): Promise<void> => {
      if (unblockingId) {
        return;
      }
      setUnblockingId(user.id);
      try {
        await unblockUser(user.id);
        setUsers(prev => (prev ?? []).filter(u => u.id !== user.id));
        setNotice(`${user.name} has been unblocked.`);
      } catch (e) {
        logger.warn('unblockUser failed', e);
        setNotice(e instanceof AppException ? e.message : "Couldn't unblock. Please try again.");
      } finally {
        setUnblockingId(null);
      }
    },
    [unblockingId],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Blocked users" />

      {users === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyBody}>
            People you block are hidden from your browse and can&rsquo;t reach you. They&rsquo;ll show
            up here so you can unblock them.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {users.map(user => {
            const busy = unblockingId === user.id;
            return (
              <View key={user.id} style={styles.row}>
                <GradientAvatar
                  initials={user.name.trim().slice(0, 1).toUpperCase()}
                  seed={user.name}
                  uri={user.avatarUrl ?? undefined}
                  size={moderateScale(44)}
                />
                <Text style={styles.name} numberOfLines={1}>
                  {user.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    void handleUnblock(user);
                  }}
                  style={({ pressed }) => [styles.unblockBtn, pressed && styles.unblockBtnPressed]}
                >
                  <Text style={styles.unblockText}>{busy ? 'Unblocking…' : 'Unblock'}</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Toast message={notice} onHide={() => setNotice(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.xl,
  },
  emptyTitle: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(18),
    color: AppColors.onSurface,
    marginBottom: AppSpacing.sm,
  },
  emptyBody: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(21),
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
  },
  scroll: { padding: AppSpacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: InterFont.medium,
    fontSize: scaleFont(16),
    color: AppColors.onSurface,
  },
  unblockBtn: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: moderateScale(8),
    borderRadius: AppRadii.full,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  unblockBtnPressed: { backgroundColor: AppColors.primarySubtle },
  unblockText: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(14),
    color: AppColors.primary,
  },
});

export default BlockedUsersScreen;
