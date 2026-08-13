import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { moderateScale } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { type AppNotification, type NotificationKind } from '../api/notificationApi';

export type NotificationItemProps = {
  item: AppNotification;
};

function relativeTime(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
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

function chatBubbleIcon(c: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill={c}
      />
    </Svg>
  );
}

function walletIcon(c: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8z"
        fill={c}
      />
    </Svg>
  );
}

function verifiedIcon(c: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
        fill={c}
      />
    </Svg>
  );
}

function bellIcon(c: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={c}
      />
    </Svg>
  );
}

type Visual = {
  bgColor: string;
  iconColor: string;
  renderIcon: (color: string) => React.ReactElement;
};

function visualFor(kind: NotificationKind): Visual {
  switch (kind) {
    case 'chatRequest':
      return {
        bgColor: AppColors.primarySubtle,
        iconColor: AppColors.primary,
        renderIcon: chatBubbleIcon,
      };
    case 'paymentReceived':
      return {
        bgColor: AppColors.successLight,
        iconColor: AppColors.success,
        renderIcon: walletIcon,
      };
    case 'verificationUpdate':
      return { bgColor: AppColors.infoLight, iconColor: AppColors.info, renderIcon: verifiedIcon };
    case 'system':
      return {
        bgColor: AppColors.surfaceVariant,
        iconColor: AppColors.onSurfaceMuted,
        renderIcon: bellIcon,
      };
  }
}

/** Row in the Notifications screen list. */
function NotificationItem({ item }: NotificationItemProps): React.ReactElement {
  const visual = useMemo(() => visualFor(item.kind), [item.kind]);
  const time = useMemo(() => relativeTime(item.occurredAt), [item.occurredAt]);
  const unread = !item.read;

  return (
    <View style={[styles.row, unread && styles.rowUnread]}>
      {unread ? <View style={styles.unreadBar} /> : null}
      <View style={[styles.iconCircle, { backgroundColor: visual.bgColor }]}>
        {visual.renderIcon(visual.iconColor)}
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{time}</Text>
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
    gap: AppSpacing.sm,
  },
  rowUnread: { backgroundColor: AppColors.primarySubtle },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: AppColors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  title: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  body: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: moderateScale(2),
  },
  right: { alignItems: 'flex-end', gap: moderateScale(4) },
  time: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
});

export default NotificationItem;
