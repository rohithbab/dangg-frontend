import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Avatar from '@core/components/Avatar';
import PrimaryButton from '@core/components/PrimaryButton';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { type AvailableFemale, getFemaleById } from '@features/maleHome/api/maleHomeApi';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'LikeDislikeRating'>;
type Route = RouteProp<MaleAppStackParamList, 'LikeDislikeRating'>;

type Verdict = 'like' | 'dislike' | null;

function ThumbUpIcon({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24">
      <Path
        d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73V10z"
        fill={color}
      />
    </Svg>
  );
}

function ThumbDownIcon({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24">
      <Path
        d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
        fill={color}
      />
    </Svg>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

/**
 * Post-chat rating. Mandatory by design (no back button via BackHandler), but
 * a discrete "Skip" link sits in the app bar for cases where the user just
 * wants out. Submit is disabled until a verdict is chosen.
 */
function LikeDislikeRatingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { femaleId } = route.params;

  const [female, setFemale] = useState<AvailableFemale | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const likeScale = useSharedValue(1);
  const dislikeScale = useSharedValue(1);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    getFemaleById(femaleId)
      .then(f => setFemale(f))
      .catch(e => logger.warn('LikeDislikeRating.getFemaleById failed', e));
  }, [femaleId]);

  const goHome = useCallback((): void => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MaleTabs', params: { screen: 'Home' } }],
    });
  }, [navigation]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!verdict || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      // Persisting the rating is a backend wiring task; logging for now.
      logger.info('Chat rating submitted', { femaleId, verdict, comment: comment.trim() });
      goHome();
    } catch (e) {
      logger.error('LikeDislikeRating.submit failed', e);
      setSubmitting(false);
    }
  }, [comment, femaleId, goHome, submitting, verdict]);

  const pickVerdict = useCallback(
    (next: Verdict): void => {
      setVerdict(next);
      if (next === 'like') {
        likeScale.value = withSpring(1.15, { damping: 8, stiffness: 220 }, () => {
          likeScale.value = withTiming(1, { duration: 150 });
        });
      } else if (next === 'dislike') {
        dislikeScale.value = withSpring(1.15, { damping: 8, stiffness: 220 }, () => {
          dislikeScale.value = withTiming(1, { duration: 150 });
        });
      }
    },
    [dislikeScale, likeScale],
  );

  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const dislikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dislikeScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar
        title="Rate your chat"
        showBack={false}
        actions={
          <Pressable onPress={goHome} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.heroBlock}>
            <View style={styles.avatarRing}>
              <Avatar
                uri={female?.imageUrl ?? null}
                size={120}
                initials={initialsFromName(female?.name ?? '?')}
              />
            </View>
            <Text style={styles.question}>
              {`How was your chat with ${female?.name ?? 'her'}?`}
            </Text>
            <Text style={styles.subtitle}>Your feedback helps others.</Text>
          </View>

          <View style={styles.verdictRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Like"
              accessibilityState={{ selected: verdict === 'like' }}
              onPress={() => pickVerdict('like')}
              hitSlop={6}
              style={styles.verdictPressable}
            >
              <Animated.View
                style={[
                  styles.verdictCircle,
                  verdict === 'like' && styles.verdictCircleLikeActive,
                  likeStyle,
                ]}
              >
                <ThumbUpIcon color={verdict === 'like' ? AppColors.onPrimary : AppColors.success} />
              </Animated.View>
              <Text style={[styles.verdictLabel, verdict === 'like' && styles.verdictLabelActive]}>
                Like
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dislike"
              accessibilityState={{ selected: verdict === 'dislike' }}
              onPress={() => pickVerdict('dislike')}
              hitSlop={6}
              style={styles.verdictPressable}
            >
              <Animated.View
                style={[
                  styles.verdictCircle,
                  verdict === 'dislike' && styles.verdictCircleDislikeActive,
                  dislikeStyle,
                ]}
              >
                <ThumbDownIcon
                  color={verdict === 'dislike' ? AppColors.onPrimary : AppColors.error}
                />
              </Animated.View>
              <Text
                style={[styles.verdictLabel, verdict === 'dislike' && styles.verdictLabelActive]}
              >
                Dislike
              </Text>
            </Pressable>
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={AppColors.onSurfaceMuted}
            style={styles.commentInput}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Submit"
            onPress={() => {
              void handleSubmit();
            }}
            disabled={!verdict}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  skipText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    paddingHorizontal: AppSpacing.sm,
  },
  scroll: {
    padding: AppSpacing.lg,
    alignItems: 'center',
  },
  heroBlock: { alignItems: 'center' },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  question: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
    textAlign: 'center',
  },
  verdictRow: {
    flexDirection: 'row',
    gap: AppSpacing.xl,
    marginTop: AppSpacing.xl,
  },
  verdictPressable: { alignItems: 'center' },
  verdictCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  verdictCircleLikeActive: {
    backgroundColor: AppColors.success,
    borderColor: AppColors.success,
  },
  verdictCircleDislikeActive: {
    backgroundColor: AppColors.error,
    borderColor: AppColors.error,
  },
  verdictLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  verdictLabelActive: {
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  commentInput: {
    alignSelf: 'stretch',
    marginTop: AppSpacing.xl,
    minHeight: 96,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppRadii.md,
    padding: AppSpacing.sm,
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
  },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
});

export default LikeDislikeRatingScreen;
