import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FC, FR, FS } from '@features/femaleHome/femaleTheme';

import { type Transaction } from '../api/earningsApi';

export type TransactionItemProps = {
  item: Transaction;
};

function relativeShort(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return '';
  }
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) {
    return 'just now';
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

function iconArrowDown(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" fill={color} />
    </Svg>
  );
}

function iconArrowUp(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill={color} />
    </Svg>
  );
}

function iconReplay(color: string): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill={color}
      />
    </Svg>
  );
}

type Visual = {
  bgColor: string;
  iconColor: string;
  amountColor: string;
  amountPrefix: string;
  renderIcon: (color: string) => React.ReactElement;
};

function visualFor(item: Transaction): Visual {
  switch (item.kind) {
    case 'earning':
      return {
        bgColor: FC.successSoft,
        iconColor: FC.successText,
        amountColor: FC.successText,
        amountPrefix: '+',
        renderIcon: iconArrowDown,
      };
    case 'payout':
      return {
        bgColor: FC.primarySoft,
        iconColor: FC.primary,
        amountColor: FC.text,
        amountPrefix: '-',
        renderIcon: iconArrowUp,
      };
    case 'refund':
      return {
        bgColor: FC.secondarySoft,
        iconColor: FC.secondary,
        amountColor: FC.text,
        amountPrefix: '-',
        renderIcon: iconReplay,
      };
  }
}

function TransactionItem({ item }: TransactionItemProps): React.ReactElement {
  const visual = useMemo(() => visualFor(item), [item]);
  const time = useMemo(() => relativeShort(item.occurredAt), [item.occurredAt]);

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: visual.bgColor }]}>
        {visual.renderIcon(visual.iconColor)}
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {`${item.subtitle} · ${time}`}
          </Text>
          {item.status !== 'completed' && (
            <View
              style={[
                styles.statusBadge,
                item.status === 'processing' ? styles.statusProcessing : styles.statusFailed,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  item.status === 'processing'
                    ? styles.statusTextProcessing
                    : styles.statusTextFailed,
                ]}
              >
                {item.status === 'processing' ? 'In Review' : 'Failed'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: visual.amountColor }]}>
          {`${visual.amountPrefix}₹${item.amountInr.toLocaleString()}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: FS.lg,
    paddingVertical: FS.md + 2,
    gap: FS.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FC.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: FR.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito',
    color: FC.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FS.xs,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textDim,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: FR.sm,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  statusProcessing: {
    borderColor: FC.warning,
  },
  statusFailed: {
    borderColor: FC.error,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Nunito',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statusTextProcessing: {
    color: FC.warning,
  },
  statusTextFailed: {
    color: FC.error,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Poppins',
    letterSpacing: -0.3,
  },
});

export default TransactionItem;
