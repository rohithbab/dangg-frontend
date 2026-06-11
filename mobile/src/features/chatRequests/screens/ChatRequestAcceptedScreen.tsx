import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestAccepted'>;

// Approximate length of the checkmark path "M14 27 l8 8 16-16"
// segment 1: 8√2 ≈ 11.31   segment 2: 16√2 ≈ 22.63   total ≈ 33.94
const CHECK_PATH_LENGTH = 34;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedCheckmark(): React.ReactElement {
  const circleScale = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Circle pops in with a spring bounce
    circleScale.value = withSpring(1, { damping: 10, stiffness: 220, mass: 0.8 });

    // 2. After circle settles, draw the checkmark stroke
    const t = setTimeout(() => {
      checkOpacity.value = withTiming(1, { duration: 50 });
      checkProgress.value = withTiming(1, {
        duration: 550,
        easing: Easing.out(Easing.cubic),
      });
    }, 320);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - checkProgress.value),
  }));

  return (
    <Animated.View style={[styles.checkCircle, circleStyle]}>
      <Animated.View style={checkStyle}>
        <Svg width={64} height={64} viewBox="0 0 52 52">
          <AnimatedPath
            animatedProps={checkAnimatedProps}
            d="M14 27 l8 8 16-16"
            stroke={AppColors.success}
            strokeWidth={4}
            fill="none"
            strokeDasharray={CHECK_PATH_LENGTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

function ChatRequestAcceptedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MaleAppStackParamList, 'ChatRequestAccepted'>>();

  // Content entrance — staggered after the checkmark
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(16);

  useEffect(() => {
    contentOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    contentY.value = withDelay(700, withSpring(0, { damping: 16, stiffness: 120 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const { requestId } = route.params;
    const timer = setTimeout(() => {
      navigation.replace('ChatSession', { requestId });
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigation, route.params]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <AnimatedCheckmark />

        <Animated.View style={[styles.textBlock, contentStyle]}>
          <Text style={styles.title}>Request Accepted!</Text>
          <Text style={styles.subtitle}>She's ready to chat</Text>
          <Text style={styles.hint}>Starting chat…</Text>
        </Animated.View>
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
    gap: AppSpacing.xl,
  },
  checkCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', gap: AppSpacing.xs },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  hint: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
});

export default ChatRequestAcceptedScreen;
