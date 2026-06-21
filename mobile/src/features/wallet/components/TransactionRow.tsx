import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { timeAgo } from '@core/utils/formatters';

import { type WalletTransaction } from '../api/walletApi';
import { WC, WR, WS } from '../walletTheme';

type TransactionRowProps = {
  item: WalletTransaction;
  /** Reserved for a future swipe-to-reveal detail action. */
  onPress?: () => void;
};

function PurchaseIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12l7-7 7 7"
        stroke={WC.successText}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
        stroke={WC.primary}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefundIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6"
        stroke={WC.secondary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TypeIcon({ kind }: { kind: WalletTransaction['kind'] }): React.ReactElement {
  if (kind === 'purchase') {
    return <PurchaseIcon />;
  }
  if (kind === 'refund') {
    return <RefundIcon />;
  }
  return <ChatIcon />;
}

function iconBackground(kind: WalletTransaction['kind']): string {
  if (kind === 'purchase') {
    return WC.successSoft;
  }
  if (kind === 'refund') {
    return WC.secondarySoft;
  }
  return WC.primarySoft;
}

function statusVisual(status: WalletTransaction['status']): { label: string; color: string } {
  if (status === 'processing') {
    return { label: 'Processing', color: WC.warning };
  }
  if (status === 'failed') {
    return { label: 'Failed', color: '#F87171' };
  }
  return { label: 'Completed', color: WC.successText };
}

/** Premium activity-feed row: type icon, title/description, amount + status. */
function TransactionRow({ item }: TransactionRowProps): React.ReactElement {
  const positive = item.coinDelta > 0;
  const amountColor = positive ? WC.successText : WC.text;
  const sign = positive ? '+' : '−';
  const magnitude = Math.abs(item.coinDelta);
  const status = statusVisual(item.status);

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground(item.kind) }]}>
        <TypeIcon kind={item.kind} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {`${item.subtitle} · ${timeAgo(item.occurredAt)}`}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>{`${sign}${magnitude}`}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: WS.lg,
    paddingVertical: WS.md + 3,
    gap: WS.md + 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: WR.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '700', color: WC.text },
  subtitle: { fontSize: 12.5, fontWeight: '500', color: WC.textDim, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
});

export default TransactionRow;
