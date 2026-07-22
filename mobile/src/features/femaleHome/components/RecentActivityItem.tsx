import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Avatar from '@core/components/Avatar';
import CoinIcon from '@core/components/CoinIcon';

import { type RecentActivity } from '../api/femaleHomeApi';
import { FC, FS } from '../femaleTheme';

export type RecentActivityItemProps = {
  item: RecentActivity;
};

function relativeTime(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** How long the room lasted, e.g. "45s", "5m 23s", "1h 4m". */
function formatRoomDuration(seconds: number): string {
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

function RecentActivityItem({ item }: RecentActivityItemProps): React.ReactElement {
  const time = useMemo(() => relativeTime(item.occurredAt), [item.occurredAt]);
  // Append the room duration to a completed chat, e.g. "Chat completed · 5m 23s".
  const detail =
    item.kind === 'chatCompleted' && item.durationSeconds != null
      ? `${item.description} · ${formatRoomDuration(item.durationSeconds)}`
      : item.description;

  return (
    <View style={styles.row}>
      <Avatar uri={item.actorAvatarUrl} size={40} initials={initialsFromName(item.actorName)} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {item.actorName}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.right}>
        {item.amountInr !== null ? (
          <View style={styles.amountWrap}>
            <Text style={styles.amount}>{`+${item.amountInr.toLocaleString()}`}</Text>
            <CoinIcon size={14} />
          </View>
        ) : null}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: FS.md + 2,
    paddingHorizontal: FS.lg,
    gap: FS.sm,
  },
  middle: { flex: 1, marginHorizontal: FS.sm },
  name: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Regular',
    color: FC.text,
  },
  description: {
    fontSize: 12.5,
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
    color: FC.textDim,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Inter-SemiBold',
    color: FC.successText,
    letterSpacing: -0.2,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-Regular',
    color: FC.textFaint,
    marginTop: 2,
  },
});

export default RecentActivityItem;
