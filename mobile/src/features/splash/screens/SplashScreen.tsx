import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { APP_NAME } from '@core/config/constants';

import { type AuthStackParamList } from '@navigation/types';

const TOTAL_MS = 2200;
const PHASE_1_END = 700;
const PHASE_2_END = 1000;
const PHASE_3_END = 1700;
const LOGO_DROP_DURATION = PHASE_1_END;
const SLIDE_DURATION = PHASE_3_END - PHASE_2_END;
const WORDMARK_DELAY = PHASE_2_END;

type SplashNav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

/**
 * Splash boot screen. Plays a 2.2s logo-drop + wordmark-reveal animation,
 * then routes to AccountType. Session-aware routing is handled by
 * RootNavigator's authenticated switch — when this screen renders, we
 * already know there is no session.
 */
function SplashScreen(): React.ReactElement {
  const navigation = useNavigation<SplashNav>();
  const naveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoTranslateY = useSharedValue(-200);
  const logoTranslateX = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateX = useSharedValue(-30);

  useEffect(() => {
    logoTranslateY.value = withTiming(0, {
      duration: LOGO_DROP_DURATION,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    logoTranslateX.value = withSequence(
      withDelay(
        PHASE_2_END,
        withTiming(-60, { duration: SLIDE_DURATION, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    wordmarkOpacity.value = withDelay(
      WORDMARK_DELAY,
      withTiming(1, { duration: SLIDE_DURATION, easing: Easing.inOut(Easing.cubic) }),
    );
    wordmarkTranslateX.value = withDelay(
      WORDMARK_DELAY,
      withTiming(30, { duration: SLIDE_DURATION, easing: Easing.inOut(Easing.cubic) }),
    );

    naveTimerRef.current = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AccountType' }],
      });
    }, TOTAL_MS);

    return () => {
      if (naveTimerRef.current) {
        clearTimeout(naveTimerRef.current);
      }
    };
  }, [logoTranslateX, logoTranslateY, navigation, wordmarkOpacity, wordmarkTranslateX]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }, { translateX: logoTranslateX.value }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateX: wordmarkTranslateX.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.gradientRoseStart}
        translucent={false}
      />
      <View style={styles.center}>
        <Animated.View style={[styles.logo, AppShadows.e2, logoStyle]}>
          <Text style={styles.logoLetter}>D</Text>
        </Animated.View>
        <Animated.Text style={[styles.wordmark, wordmarkStyle]}>{APP_NAME}</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.gradientRoseStart,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: AppRadii.lg,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    ...AppTypography.displayLarge,
    color: AppColors.primaryDark,
  },
  wordmark: {
    ...AppTypography.displayLarge,
    color: AppColors.surface,
    marginLeft: AppSpacing.md,
  },
});

export default SplashScreen;
