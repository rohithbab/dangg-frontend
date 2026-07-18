import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { PanResponder, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type SwipeableTabScreenProps = {
  /** Ordered tab route names, left to right. */
  order: readonly string[];
  /** This screen's own route name within `order`. */
  routeName: string;
  children: React.ReactNode;
};

const DISTANCE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.35;
// Horizontal movement must dominate vertical by this much before we claim the
// gesture, so nested horizontal scrollers (e.g. the Favourites carousel) keep
// first claim on the touch and vertical list scrolling is unaffected.
const DIRECTIONAL_RATIO = 2.5;
const CLAIM_THRESHOLD = 16;

const ENTER_OFFSET = 56;
const ENTER_DURATION = 220;
const ENTER_EASING = Easing.out(Easing.cubic);

// Bottom-tab screens are siblings, not stacked, so there's no built-in
// crossfade between them — this tracks which tab was last focused (shared by
// every screen wrapped in this component within one Tab.Navigator) purely to
// pick which edge the newly-focused tab should slide in from. Works whether
// the switch was triggered by a swipe here or a direct tap on the tab bar.
const lastFocusedIndex: { current: number | null } = { current: null };

/**
 * Wraps a bottom-tab screen so a left/right swipe anywhere on it jumps to the
 * previous/next tab in `order` (Home ↔ Wallet/Earnings ↔ Profile), and gives
 * the newly-focused tab a short slide + fade entrance instead of an instant
 * cut.
 */
function SwipeableTabScreen({
  order,
  routeName,
  children,
}: SwipeableTabScreenProps): React.ReactElement {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const hasFocusedBefore = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const myIndex = order.indexOf(routeName);
      const prevIndex = lastFocusedIndex.current;
      lastFocusedIndex.current = myIndex;

      if (hasFocusedBefore.current && prevIndex !== null && prevIndex !== myIndex) {
        const enteringFromRight = myIndex > prevIndex;
        translateX.value = enteringFromRight ? ENTER_OFFSET : -ENTER_OFFSET;
        opacity.value = 0.4;
        translateX.value = withTiming(0, { duration: ENTER_DURATION, easing: ENTER_EASING });
        opacity.value = withTiming(1, { duration: ENTER_DURATION, easing: ENTER_EASING });
      }
      hasFocusedBefore.current = true;
    }, [order, routeName, translateX, opacity]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > CLAIM_THRESHOLD &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * DIRECTIONAL_RATIO,
      onPanResponderRelease: (_evt, gesture) => {
        const index = order.indexOf(routeName);
        const swipedLeft = gesture.dx < -DISTANCE_THRESHOLD || gesture.vx < -VELOCITY_THRESHOLD;
        const swipedRight = gesture.dx > DISTANCE_THRESHOLD || gesture.vx > VELOCITY_THRESHOLD;
        if (swipedLeft && index < order.length - 1) {
          navigation.navigate(order[index + 1] as string);
        } else if (swipedRight && index > 0) {
          navigation.navigate(order[index - 1] as string);
        }
      },
    }),
  ).current;

  return (
    <Animated.View style={[styles.flex, animatedStyle]} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default SwipeableTabScreen;
