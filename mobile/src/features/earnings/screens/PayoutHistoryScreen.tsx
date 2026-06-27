import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import EmptyState from '@core/components/EmptyState';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { type PayoutRecord, type PayoutUiStatus, listPayouts } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutHistory'>;

const STATUS_META: Record<PayoutUiStatus, { label: string; color: string; tint: string }> = {
  processing: { label: 'Processing', color: AppColors.coinGold, tint: 'rgba(245,181,61,0.14)' },
  paid: { label: 'Paid', color: AppColors.success, tint: 'rgba(52,211,153,0.14)' },
  failed: { label: 'Failed', color: AppColors.error, tint: 'rgba(248,113,113,0.14)' },
  cancelled: { label: 'Cancelled', color: AppColors.onSurfaceMuted, tint: AppColors.surface },
};

/** F9 · Payout history — month-grouped list of every withdrawal. */
function PayoutHistoryScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [payouts, setPayouts] = useState<ReadonlyArray<PayoutRecord>>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listPayouts()
        .then(setPayouts)
        .catch(e => logger.error('PayoutHistoryScreen.list failed', e))
        .finally(() => setLoaded(true));
    }, []),
  );

  /** Group into [monthLabel, rows][] preserving newest-first order. */
  const groups = useMemo(() => {
    const out: Array<{ key: string; rows: PayoutRecord[] }> = [];
    for (const p of payouts) {
      const key = format(p.requestedAt, 'MMMM yyyy').toUpperCase();
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.rows.push(p);
      } else {
        out.push({ key, rows: [p] });
      }
    }
    return out;
  }, [payouts]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Payout history</Text>

        {loaded && payouts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No payouts yet"
              body="Your withdrawals will show up here once you request one."
            />
          </View>
        ) : (
          groups.map(group => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupLabel}>{group.key}</Text>
              {group.rows.map(p => {
                const meta = STATUS_META[p.status];
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('PayoutDetail', { payoutId: p.id })}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={[styles.dot, { backgroundColor: meta.color }]} />
                    <View style={styles.rowMain}>
                      <Text style={styles.amount}>{inr(p.amountInr)}</Text>
                      <Text style={styles.method}>{p.methodLabel}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View style={[styles.badge, { backgroundColor: meta.tint }]}>
                        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={styles.date}>{format(p.requestedAt, 'd MMM')}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  scroll: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.xl },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  emptyWrap: { marginTop: 48 },
  group: { marginBottom: AppSpacing.lg },
  groupLabel: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  rowPressed: { opacity: 0.85 },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 12 },
  rowMain: { flex: 1 },
  amount: { fontFamily: InterFont.semibold, fontSize: 16, color: AppColors.onSurface },
  method: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  rowRight: { alignItems: 'flex-end' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: InterFont.medium, fontSize: 12 },
  date: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceMuted,
    marginTop: 6,
  },
});

export default PayoutHistoryScreen;
