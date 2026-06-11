import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { USE_MOCK_DATA } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { UserRole } from '@app-types/domain';

import {
  markOnboardingSeen,
  setInitialPassword,
  signInWithPasswordDev,
} from '../../auth/api/authApi';
import { useSignupDraftStore } from '../../auth/store/signupDraftStore';

type Slide = {
  glyph: string;
  headline: string;
  body: string;
};

const SLIDES: ReadonlyArray<Slide> = [
  {
    glyph: '👥',
    headline: 'Browse available females',
    body: "Find someone you'd like to chat with from females who are online now.",
  },
  {
    glyph: '💰',
    headline: 'Buy coins, send chat requests',
    body: 'Top up your wallet and send a chat request anytime.',
  },
  {
    glyph: '💬',
    headline: 'Chat when she accepts',
    body: 'Once she accepts, start chatting. Coins deduct per chat session.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 3-slide male onboarding carousel. Uses FlatList with `pagingEnabled` for
 * snap behaviour — no native pager-view dependency. Skip and Get Started
 * both complete the signup, push the session, and let RootNavigator
 * switch to the male tabs.
 */
function MaleOnboardingCarousel(): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Slide>>(null);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentIndex(i);
    },
    [],
  );

  const finishOnboarding = useCallback(async (): Promise<void> => {
    if (completing) {
      return;
    }
    setCompleting(true);
    setCompleteError(null);
    try {
      const { phone, password, clear } = useSignupDraftStore.getState();
      if (USE_MOCK_DATA) {
        await signInWithPasswordDev(phone, password, UserRole.Male);
      } else {
        await setInitialPassword(password);
      }
      markOnboardingSeen();
      clear();
      // RootNavigator switches to MaleTabs as soon as the session lands —
      // no manual navigation needed.
    } catch (e) {
      setCompleting(false);
      if (e instanceof AppException) {
        setCompleteError(e.message);
      } else {
        logger.error('MaleOnboardingCarousel.finish failed', e);
        setCompleteError('Could not complete signup, try again');
      }
    }
  }, [completing]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Slide>): React.ReactElement => (
      <View style={styles.slide}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationGlyph}>{item.glyph}</Text>
        </View>
        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    ),
    [],
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {!isLastSlide ? (
        <View style={styles.skipRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void finishOnboarding();
            }}
            hitSlop={12}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.skipRowPlaceholder} />
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.headline}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.list}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {completeError ? <Text style={styles.errorText}>{completeError}</Text> : null}
        {isLastSlide ? (
          <PrimaryButton
            label="Get Started"
            onPress={() => {
              void finishOnboarding();
            }}
            loading={completing}
          />
        ) : (
          <View style={styles.footerSpacer} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.gradientRoseSubtleStart },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    height: 40,
  },
  skipRowPlaceholder: { height: 40 },
  skipText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
  list: { flexGrow: 0, flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.xl,
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationGlyph: { fontSize: 100, lineHeight: 110 },
  headline: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.xl,
  },
  body: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 16,
    backgroundColor: AppColors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: AppColors.primarySubtle,
  },
  footer: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.lg,
    minHeight: 80,
  },
  footerSpacer: { height: 52 },
  errorText: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
    marginBottom: AppSpacing.sm,
  },
});

export default MaleOnboardingCarousel;
