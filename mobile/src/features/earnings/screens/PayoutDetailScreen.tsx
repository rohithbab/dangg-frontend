import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { Check, ChevronLeft, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { type PayoutRecord, type PayoutUiStatus, getPayout } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutDetail'>;
type Route = RouteProp<FemaleAppStackParamList, 'PayoutDetail'>;

const STATUS_META: Record<PayoutUiStatus, { label: string; color: string; tint: string }> = {
  processing: { label: 'Processing', color: AppColors.coinGold, tint: 'rgba(245,181,61,0.14)' },
  paid: { label: 'Paid', color: AppColors.success, tint: 'rgba(52,211,153,0.14)' },
  failed: { label: 'Failed', color: AppColors.error, tint: 'rgba(248,113,113,0.14)' },
  cancelled: { label: 'Cancelled', color: AppColors.onSurfaceMuted, tint: AppColors.surface },
};

type Step = { label: string; sub: string | null; done: boolean; fail?: boolean };

function buildSteps(p: PayoutRecord): Step[] {
  const requested: Step = {
    label: 'Requested',
    sub: format(p.requestedAt, 'd MMM, h:mm a'),
    done: true,
  };
  if (p.status === 'failed' || p.status === 'cancelled') {
    return [
      requested,
      {
        label: p.status === 'failed' ? 'Failed' : 'Cancelled',
        sub: p.completedAt ? format(p.completedAt, 'd MMM') : null,
        done: true,
        fail: true,
      },
    ];
  }
  return [
    requested,
    { label: 'Processing', sub: null, done: p.status === 'paid' || p.status === 'processing' },
    {
      label: 'Paid',
      sub: p.completedAt ? format(p.completedAt, 'd MMM, h:mm a') : null,
      done: p.status === 'paid',
    },
  ];
}

/** F10 · Payout detail — amount, status timeline, destination card, receipt. */
function PayoutDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { payoutId } = useRoute<Route>().params;
  const [payout, setPayout] = useState<PayoutRecord | null>(null);

  useEffect(() => {
    getPayout(payoutId)
      .then(setPayout)
      .catch(e => logger.error('PayoutDetailScreen.get failed', e));
  }, [payoutId]);

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

      {!payout ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Payout</Text>
          <Text style={styles.amount}>{inr(payout.amountInr)}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_META[payout.status].tint }]}>
            <Text style={[styles.statusText, { color: STATUS_META[payout.status].color }]}>
              {STATUS_META[payout.status].label}
            </Text>
          </View>

          <View style={styles.timeline}>
            {buildSteps(payout).map((s, i, arr) => (
              <View key={s.label} style={styles.step}>
                <View style={styles.stepRail}>
                  <View
                    style={[
                      styles.stepDot,
                      s.done && !s.fail && styles.stepDotDone,
                      s.fail && styles.stepDotFail,
                    ]}
                  >
                    {s.done && !s.fail ? <Check size={13} color="#04140D" strokeWidth={3} /> : null}
                    {s.fail ? <X size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                  {i < arr.length - 1 ? (
                    <View style={[styles.stepLine, s.done && styles.stepLineDone]} />
                  ) : null}
                </View>
                <View style={styles.stepBody}>
                  <Text style={[styles.stepLabel, !s.done && styles.stepLabelPending]}>
                    {s.label}
                  </Text>
                  {s.sub ? <Text style={styles.stepSub}>{s.sub}</Text> : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <DetailRow label="To" value={payout.methodLabel} />
            <DetailRow label="Requested" value={format(payout.requestedAt, 'd MMM, h:mm a')} />
            {payout.reference ? <DetailRow label="Reference" value={payout.reference} /> : null}
            <DetailRow label="Fee" value="Free" last />
          </View>

          {payout.status === 'paid' ? (
            <>
              <Text style={styles.paidLine}>
                {payout.completedAt ? `Paid on ${format(payout.completedAt, 'd MMM')}` : 'Paid'}
              </Text>
              <Pressable accessibilityRole="button" style={styles.receiptBtn}>
                <Text style={styles.receiptText}>Download receipt</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurfaceMuted },
  scroll: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.xl },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  amount: {
    fontFamily: InterFont.light,
    fontSize: 46,
    letterSpacing: -1.4,
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: AppSpacing.sm,
  },
  statusText: { fontFamily: InterFont.medium, fontSize: 13 },
  timeline: { marginTop: AppSpacing.xl + 4 },
  step: { flexDirection: 'row' },
  stepRail: { width: 28, alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: AppColors.success, borderColor: AppColors.success },
  stepDotFail: { backgroundColor: AppColors.error, borderColor: AppColors.error },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 26,
    backgroundColor: AppColors.border,
    marginVertical: 2,
  },
  stepLineDone: { backgroundColor: AppColors.success },
  stepBody: { flex: 1, marginLeft: 14, paddingBottom: 20 },
  stepLabel: { fontFamily: InterFont.medium, fontSize: 15.5, color: AppColors.onSurface },
  stepLabelPending: { color: AppColors.onSurfaceMuted },
  stepSub: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 18,
    marginTop: AppSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontFamily: InterFont.regular, fontSize: 14, color: AppColors.onSurfaceMuted },
  detailValue: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.onSurface },
  paidLine: {
    fontFamily: InterFont.medium,
    fontSize: 13.5,
    color: AppColors.success,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  receiptBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  receiptText: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.onSurfaceMuted },
});

export default PayoutDetailScreen;
