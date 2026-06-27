import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { inr } from '@core/utils/formatters';

import { type FemaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'WithdrawResult'>;
type Route = RouteProp<FemaleAppStackParamList, 'WithdrawResult'>;

/** F8 · Withdraw result — confirmation that the payout was requested. */
function WithdrawResultScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { amountInr, destinationLabel } = useRoute<Route>().params;

  // Terminal screen — block hardware back into the withdraw flow.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const goEarnings = (): void => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'FemaleTabs', params: { screen: 'Earnings' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.check}>
          <Check size={40} color="#04140D" strokeWidth={3} />
        </View>
        <Text style={styles.title}>Withdrawal requested</Text>
        <Text style={styles.sub}>{`${inr(amountInr)} to ${destinationLabel}`}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Arrives in 2–3 business days</Text>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <PrimaryButton
          label="View status"
          onPress={() => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'FemaleTabs', params: { screen: 'Earnings' } },
                { name: 'PayoutHistory' },
              ],
            });
          }}
        />
        <Pressable accessibilityRole="button" onPress={goEarnings} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  check: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: AppColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: 22,
    color: AppColors.onSurface,
    marginTop: AppSpacing.lg,
    textAlign: 'center',
  },
  sub: {
    fontFamily: InterFont.regular,
    fontSize: 14.5,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  chip: {
    backgroundColor: AppColors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: AppSpacing.lg,
  },
  chipText: { fontFamily: InterFont.regular, fontSize: 13, color: AppColors.onSurfaceMuted },
  ctaWrap: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
  doneBtn: { alignItems: 'center', paddingVertical: 14 },
  doneText: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurfaceMuted },
});

export default WithdrawResultScreen;
