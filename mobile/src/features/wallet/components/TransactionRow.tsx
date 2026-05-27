import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import { timeAgo } from '@core/utils/formatters';

import { type WalletTransaction } from '../api/walletApi';

type TransactionRowProps = {
  item: WalletTransaction;
  /** Reserved for a future swipe-to-reveal detail action. */
  onPress?: () => void;
};

function PurchaseIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M7 4V2h10v2h3a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4h-.34a6 6 0 0 1-3.66 3.74V18h3v2H8v-2h3v-2.26A6 6 0 0 1 7.34 12H7a4 4 0 0 1-4-4V5a1 1 0 0 1 1-1h3zm10 2H7v3a4 4 0 0 0 8 0V6h2zm-12 2V6H4v2a2 2 0 0 0 2 2V8a2 2 0 0 1-1-2zm14 0V6h-1v2a2 2 0 0 1-1 2v0a2 2 0 0 0 2-2z"
        fill={AppColors.success}
      />
    </Svg>
  );
}

function ChatIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function RefundIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill={AppColors.info}
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
    return AppColors.successLight;
  }
  if (kind === 'refund') {
    return AppColors.infoLight;
  }
  return AppColors.primarySubtle;
}

/** Single transaction row with type-coded icon, title/subtitle, and amount. */
function TransactionRow({ item }: TransactionRowProps): React.ReactElement {
  const positive = item.coinDelta > 0;
  const amountColor = positive ? AppColors.success : AppColors.onSurface;
  const sign = positive ? '+' : '−';
  const magnitude = Math.abs(item.coinDelta);
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
          {`${item.subtitle} • ${timeAgo(item.occurredAt)}`}
        </Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: amountColor }]}>{`${sign}${magnitude}`}</Text>
        <CoinIcon size={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 4,
    gap: AppSpacing.sm + 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: AppRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  title: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  subtitle: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    ...AppTypography.bodyLarge,
    fontWeight: '700',
  },
});

export default TransactionRow;
