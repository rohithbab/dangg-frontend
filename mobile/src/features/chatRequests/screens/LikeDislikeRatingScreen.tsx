import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star } from 'lucide-react-native';
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
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Avatar from '@core/components/Avatar';
import PrimaryButton from '@core/components/PrimaryButton';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import {
  type AvailableFemale,
  getFemaleById,
  submitChatRating,
} from '@features/maleHome/api/maleHomeApi';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'LikeDislikeRating'>;
type Route = RouteProp<MaleAppStackParamList, 'LikeDislikeRating'>;

const STARS = [1, 2, 3, 4, 5] as const;
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

/**
 * Post-chat rating. The male picks 1–5 stars; the backend averages every
 * rater's stars into the female's `rating_avg`. Mandatory by design (no
 * hardware back), with a discrete "Skip" in the app bar. Submit is disabled
 * until at least one star is chosen.
 */
function LikeDislikeRatingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { femaleId } = route.params;

  const [female, setFemale] = useState<AvailableFemale | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rowScale = useSharedValue(1);

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

  const pickStar = useCallback(
    (n: number): void => {
      setRating(n);
      rowScale.value = withSequence(
        withTiming(1.1, { duration: 90 }),
        withSpring(1, { damping: 9, stiffness: 240 }),
      );
    },
    [rowScale],
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (rating === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitChatRating(femaleId, rating, comment.trim());
      logger.info('Chat rating submitted', { femaleId, ...result });
    } catch (e) {
      // Best-effort: a rating failure must not strand the user on this screen.
      logger.error('LikeDislikeRating.submit failed', e);
    } finally {
      goHome();
    }
  }, [comment, femaleId, goHome, rating, submitting]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: rowScale.value }] }));

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
            <Text style={styles.subtitle}>Tap to rate her out of 5 stars.</Text>
          </View>

          <Animated.View style={[styles.starRow, rowStyle]}>
            {STARS.map(n => {
              const filled = n <= rating;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  accessibilityState={{ selected: filled }}
                  onPress={() => pickStar(n)}
                  hitSlop={6}
                  style={styles.starBtn}
                >
                  <Star
                    size={44}
                    strokeWidth={1.6}
                    color={filled ? AppColors.coinGold : AppColors.onSurfaceMuted}
                    fill={filled ? AppColors.coinGold : 'transparent'}
                  />
                </Pressable>
              );
            })}
          </Animated.View>
          <Text style={styles.ratingHint}>{rating > 0 ? STAR_LABELS[rating] : ' '}</Text>

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
            disabled={rating === 0}
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
  starRow: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.xl,
  },
  starBtn: { padding: 2 },
  ratingHint: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
    minHeight: 22,
  },
  commentInput: {
    alignSelf: 'stretch',
    marginTop: AppSpacing.lg,
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
