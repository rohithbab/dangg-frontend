import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { type ChatHistoryItem, listChatHistory } from '../api/chatRequestApi';

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

function ChatRow({
  item,
  onPress,
}: {
  item: ChatHistoryItem;
  onPress: (item: ChatHistoryItem) => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${item.counterpartName}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, AppShadows.e1, pressed && styles.rowPressed]}
    >
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

  const renderItem = useCallback(
    ({ item }: { item: ChatHistoryItem }) => <ChatRow item={item} onPress={handleOpen} />,
    [handleOpen],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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

      <FlashList<ChatHistoryItem>
        data={items}
        keyExtractor={item => item.sessionId}
        renderItem={renderItem}
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
  rowPressed: { opacity: 0.7 },
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
