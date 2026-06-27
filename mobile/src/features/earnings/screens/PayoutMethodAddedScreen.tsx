import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';

import { type FemaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutMethodAdded'>;

/** F5 · Method added — confirmation after saving a payout method. */
function PayoutMethodAddedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.check}>
          <Check size={40} color="#04140D" strokeWidth={3} />
        </View>
        <Text style={styles.title}>Method added</Text>
        <Text style={styles.sub}>You can now withdraw your earnings to it.</Text>
      </View>

      <View style={styles.ctaWrap}>
        <PrimaryButton
          label="Done"
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [
                { name: 'FemaleTabs', params: { screen: 'Earnings' } },
                { name: 'PayoutMethods' },
              ],
            })
          }
        />
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
  },
  sub: {
    fontFamily: InterFont.regular,
    fontSize: 14.5,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  ctaWrap: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
});

export default PayoutMethodAddedScreen;
