import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestTimeout'>;

function ClockIcon(): React.ReactElement {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24">
      <Path
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        fill={AppColors.warning}
      />
    </Svg>
  );
}

/** Outcome screen when the female doesn't respond before expiry. */
function ChatRequestTimeoutScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const goHome = (): void => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <ClockIcon />
        </View>
        <Text style={styles.title}>No Response</Text>
        <Text style={styles.subtitle}>She didn't respond in time</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Try Someone Else" onPress={goHome} />
        <TextButton label="Back to Home" onPress={goHome} />
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
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default ChatRequestTimeoutScreen;
