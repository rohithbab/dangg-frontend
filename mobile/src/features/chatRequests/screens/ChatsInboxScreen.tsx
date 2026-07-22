import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Check, Clock, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { BackHandler, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { type ChatHistoryItem, hideChatSession, listChatHistory } from '../api/chatRequestApi';

/** Both the male and female app stacks register `ChatSession: { requestId }`. */
type InboxNav = NativeStackNavigationProp<{ ChatSession: { requestId: string } }>;

function BackIcon(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill={AppColors.primaryDark} />
    </Svg>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '?';
}

function relativeTime(date: Date | null): string {
  if (!date) {
    return '';
  }
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return '';
  }
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** How long the room lasted, e.g. "45s", "5m 23s", "1h 4m". */
function formatRoomDuration(seconds: number | null): string {
  if (seconds == null) {
    return '';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) {
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function ChatRow({
  item,
  selectionMode,
  selected,
  onPress,
  onLongPress,
}: {
  item: ChatHistoryItem;
  selectionMode: boolean;
  selected: boolean;
  onPress: (item: ChatHistoryItem) => void;
  onLongPress: (item: ChatHistoryItem) => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        selectionMode
          ? `${selected ? 'Deselect' : 'Select'} chat with ${item.counterpartName}`
          : `Open chat with ${item.counterpartName}`
      }
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        AppShadows.e1,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      {selectionMode ? (
        <View style={[styles.checkCircle, selected && styles.checkCircleOn]}>
          {selected ? <Check size={16} color={AppColors.onPrimary} strokeWidth={3} /> : null}
        </View>
      ) : null}

      <View>
        <Avatar
          uri={item.counterpartAvatarUrl}
          size={52}
          initials={initialsFromName(item.counterpartName)}
        />
        {item.status === 'active' ? <View style={styles.onlineDot} /> : null}
      </View>

      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.counterpartName}
          </Text>
          <Text style={styles.time}>{relativeTime(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.snippetRow}>
          <Text style={styles.snippet} numberOfLines={1}>
            {item.lastMessage ?? 'No messages yet'}
          </Text>
          <View
            style={[
              styles.statusPill,
              item.status === 'active' ? styles.statusActive : styles.statusEnded,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                item.status === 'active' ? styles.statusActiveText : styles.statusEndedText,
              ]}
            >
              {item.status === 'active' ? 'Active' : 'Ended'}
            </Text>
          </View>
        </View>
        {item.status === 'ended' && item.durationSeconds != null ? (
          <View style={styles.durationRow}>
            <Clock size={12} color={AppColors.onSurfaceMuted} strokeWidth={2} />
            <Text style={styles.durationText}>
              In room for {formatRoomDuration(item.durationSeconds)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Chat Inbox — shared by both roles. Lists the caller's conversations
 * (newest-first) with the counterparty's avatar/name, last-message snippet,
 * relative time, and an active/ended indicator. Tapping a row opens the chat
 * session. All data is RLS-scoped to the caller; no other user's chats appear.
 */
function ChatsInboxScreen(): React.ReactElement {
  const navigation = useNavigation<InboxNav>();
  const [items, setItems] = useState<ReadonlyArray<ChatHistoryItem>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      setItems(await listChatHistory());
    } catch (e) {
      logger.warn('ChatsInboxScreen.load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-load each time the tab gains focus so a just-finished chat shows up.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // In selection mode, Android back exits selection instead of the screen.
  useFocusEffect(
    useCallback(() => {
      if (!selectionMode) {
        return undefined;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        exitSelection();
        return true;
      });
      return () => sub.remove();
    }, [selectionMode, exitSelection]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleOpen = useCallback(
    (item: ChatHistoryItem) => {
      navigation.navigate('ChatSession', { requestId: item.requestId });
    },
    [navigation],
  );

  const toggleSelect = useCallback((item: ChatHistoryItem) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.sessionId)) {
        next.delete(item.sessionId);
      } else {
        next.add(item.sessionId);
      }
      return next;
    });
  }, []);

  // Tap: open (normal) or toggle (selection mode). Long-press: enter selection.
  const handleRowPress = useCallback(
    (item: ChatHistoryItem) => {
      if (selectionMode) {
        toggleSelect(item);
      } else {
        handleOpen(item);
      }
    },
    [selectionMode, toggleSelect, handleOpen],
  );

  const handleRowLongPress = useCallback(
    (item: ChatHistoryItem) => {
      if (selectionMode) {
        toggleSelect(item);
      } else {
        setSelectionMode(true);
        setSelectedIds(new Set([item.sessionId]));
      }
    },
    [selectionMode, toggleSelect],
  );

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === items.length ? new Set() : new Set(items.map(i => i.sessionId)),
    );
  }, [items]);

  const confirmDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    setConfirmBulkDelete(false);
    setItems(prev => prev.filter(i => !selectedIds.has(i.sessionId)));
    exitSelection();
    void Promise.allSettled(ids.map(id => hideChatSession(id))).then(results => {
      if (results.some(r => r.status === 'rejected')) {
        logger.warn('ChatsInboxScreen.bulkDelete: some deletes failed; reloading');
        void load();
      }
    });
  }, [selectedIds, exitSelection, load]);

  const renderItem = useCallback(
    ({ item }: { item: ChatHistoryItem }) => (
      <ChatRow
        item={item}
        selectionMode={selectionMode}
        selected={selectedIds.has(item.sessionId)}
        onPress={handleRowPress}
        onLongPress={handleRowLongPress}
      />
    ),
    [selectionMode, selectedIds, handleRowPress, handleRowLongPress],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {selectionMode ? (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
            hitSlop={12}
            onPress={exitSelection}
            style={styles.backButton}
          >
            <X size={24} color={AppColors.onSurface} />
          </Pressable>
          <Text style={styles.selectionTitle}>{selectedIds.size} selected</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={allSelected ? 'Deselect all' : 'Select all'}
            hitSlop={8}
            onPress={toggleSelectAll}
            style={styles.selectAllBtn}
          >
            <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete selected chats"
            hitSlop={8}
            disabled={selectedIds.size === 0}
            onPress={() => setConfirmBulkDelete(true)}
            style={styles.deleteBtn}
          >
            <Trash2
              size={22}
              color={selectedIds.size === 0 ? AppColors.onSurfaceDisabled : AppColors.error}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      ) : (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
      )}

      {items.length > 0 ? (
        <View style={styles.infoBanner}>
          <Clock size={14} color={AppColors.onSurfaceMuted} strokeWidth={2} />
          <Text style={styles.infoText}>Chats are automatically deleted after 7 days.</Text>
        </View>
      ) : null}

      <FlashList<ChatHistoryItem>
        data={items}
        keyExtractor={item => item.sessionId}
        renderItem={renderItem}
        extraData={selectedIds}
        estimatedItemSize={84}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptyBody}>
                Your conversations will appear here once a chat begins.
              </Text>
            </View>
          )
        }
      />

      <ConfirmationDialog
        visible={confirmBulkDelete}
        title={selectedIds.size > 1 ? `Delete ${selectedIds.size} chats?` : 'Delete chat?'}
        body={
          selectedIds.size > 1
            ? `Remove ${selectedIds.size} chats from your history? This only affects your side.`
            : 'Remove this chat from your history? This only affects your side.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </SafeAreaView>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.sm,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  selectionTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
    flex: 1,
    marginLeft: AppSpacing.xs,
  },
  selectAllBtn: { paddingHorizontal: AppSpacing.sm, paddingVertical: AppSpacing.xs },
  selectAllText: { ...AppTypography.labelLarge, color: AppColors.primary },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
  },
  infoText: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  listContent: {
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    paddingBottom: BOTTOM_CLEAR,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.sm,
    gap: AppSpacing.sm,
  },
  rowSelected: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySubtle,
  },
  rowPressed: { opacity: 0.7 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.onSurfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
  middle: { flex: 1, marginLeft: AppSpacing.xs },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppSpacing.sm,
  },
  name: {
    ...AppTypography.titleMedium,
    color: AppColors.onSurface,
    flex: 1,
  },
  time: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppSpacing.sm,
    marginTop: 2,
  },
  snippet: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  durationText: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: AppRadii.full,
  },
  statusActive: { backgroundColor: AppColors.primarySubtle },
  statusEnded: { backgroundColor: AppColors.divider },
  statusPillText: {
    ...AppTypography.labelSmall,
    fontWeight: '700',
    fontSize: 10,
  },
  statusActiveText: { color: AppColors.primary },
  statusEndedText: { color: AppColors.onSurfaceMuted },
  empty: {
    alignItems: 'center',
    paddingTop: AppSpacing.xxl,
    paddingHorizontal: AppSpacing.lg,
  },
  emptyTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  emptyBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default ChatsInboxScreen;
