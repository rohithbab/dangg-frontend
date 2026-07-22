import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserX } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestDeclined'>;

/** Outcome screen when the female actively declines the request. */
function ChatRequestDeclinedScreen(): React.ReactElement {
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
          <UserX size={44} color={AppColors.error} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>Request declined</Text>
        <Text style={styles.subtitle}>
          She isn't available to chat right now. Try someone else who's online.
        </Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Try someone else" onPress={goHome} />
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
    paddingHorizontal: AppSpacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: AppColors.onSurface,
    marginTop: AppSpacing.xl,
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default ChatRequestDeclinedScreen;
