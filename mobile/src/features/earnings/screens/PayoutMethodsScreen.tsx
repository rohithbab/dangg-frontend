import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, IndianRupee, Landmark, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { getPayoutDetails } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutMethods'>;
type SavedMethod =
  | { kind: 'bank'; holderName: string; accountNumberMasked: string; ifsc: string }
  | { kind: 'upi'; upiId: string }
  | null;

/** F1 · Payout methods — the single saved bank/UPI method (one per account). */
function PayoutMethodsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [method, setMethod] = useState<SavedMethod>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getPayoutDetails()
        .then(setMethod)
        .catch(e => logger.error('PayoutMethodsScreen.get failed', e))
        .finally(() => setLoaded(true));
    }, []),
  );

  const editMethod = useCallback((): void => {
    if (!method) {
      return;
    }
    navigation.navigate(method.kind === 'upi' ? 'AddUpi' : 'AddBank');
  }, [method, navigation]);

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
        <Text style={styles.title}>Payout methods</Text>
        <Text style={styles.subtitle}>Where your earnings get sent.</Text>

        {loaded && method ? (
          <Pressable
            accessibilityRole="button"
            onPress={editMethod}
            style={({ pressed }) => [styles.methodCard, pressed && styles.pressed]}
          >
            <View style={styles.methodIcon}>
              {method.kind === 'upi' ? (
                <IndianRupee size={20} color={AppColors.onSurface} strokeWidth={2} />
              ) : (
                <Landmark size={20} color={AppColors.onSurface} strokeWidth={1.8} />
              )}
            </View>
            <View style={styles.methodBody}>
              <Text style={styles.methodName}>
                {method.kind === 'upi' ? method.upiId : 'Bank account'}
              </Text>
              <Text style={styles.methodSub}>
                {method.kind === 'upi' ? 'UPI' : `•••• ${method.accountNumberMasked.slice(-4)}`}
              </Text>
            </View>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddPayoutMethod')}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <Plus size={18} color={AppColors.onSurface} strokeWidth={2} />
          <Text style={styles.addText}>Add payout method</Text>
        </Pressable>
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
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: 14,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: AppSpacing.lg,
  },
  pressed: { opacity: 0.85 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBody: { flex: 1, marginLeft: 14 },
  methodName: { fontFamily: InterFont.medium, fontSize: 15.5, color: AppColors.onSurface },
  methodSub: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: AppColors.primarySubtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  defaultText: { fontFamily: InterFont.medium, fontSize: 12, color: AppColors.primaryLight },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 18,
    marginTop: AppSpacing.md,
  },
  addText: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurface },
});

export default PayoutMethodsScreen;
