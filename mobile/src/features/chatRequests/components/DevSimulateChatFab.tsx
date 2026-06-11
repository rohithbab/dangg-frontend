import React, { useRef, useState } from 'react';
import { Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppTypography } from '@theme/typography';

import { Env } from '@core/config/env';

import { useSessionStore } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import { useChatRequestStore } from '../store/chatRequestStore';

const FAB_SIZE = 56;
const MARGIN = 12;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * DEV-only draggable FAB that injects a mock incoming chat request into the
 * global `chatRequestStore`. The global modal then pops over whatever screen
 * the female is on, exercising the accept flow end-to-end without needing a
 * real male user paired up.
 *
 * Rendered globally in App.tsx (inside NavigationContainer) but only shows
 * when {@link Env.devMode} is on AND the logged-in role is female. Drag to
 * reposition; tap (no drag) fires the request.
 */
function DevSimulateChatFab(): React.ReactElement | null {
  const role = useSessionStore(s => s.role);

  // Start near the bottom-right corner, just above the floating bottom nav.
  const x = useSharedValue(SCREEN_WIDTH - FAB_SIZE - MARGIN);
  const y = useSharedValue(SCREEN_HEIGHT - FAB_SIZE - 140);

  // Snapshot at gesture-start so the deltas are relative.
  const startX = useRef(x.value);
  const startY = useRef(y.value);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim on touch-start, so pure taps reach the inner Pressable.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        startX.current = x.value;
        startY.current = y.value;
        movedRef.current = true;
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => {
        x.value = startX.current + g.dx;
        y.value = startY.current + g.dy;
      },
      onPanResponderRelease: () => {
        setDragging(false);
        const settledX = x.value;
        const targetX =
          settledX + FAB_SIZE / 2 < SCREEN_WIDTH / 2 ? MARGIN : SCREEN_WIDTH - FAB_SIZE - MARGIN;
        const clampedY = Math.max(MARGIN, Math.min(SCREEN_HEIGHT - FAB_SIZE - MARGIN, y.value));
        x.value = withSpring(targetX, { damping: 18, stiffness: 220 });
        y.value = withSpring(clampedY, { damping: 18, stiffness: 220 });
        // Defer flag reset so a tap that *just* finished a drag is ignored.
        setTimeout(() => {
          movedRef.current = false;
        }, 50);
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        setTimeout(() => {
          movedRef.current = false;
        }, 50);
      },
    }),
  ).current;

  const trigger = (): void => {
    if (movedRef.current) {
      return;
    }
    useChatRequestStore.getState().setIncoming({
      id: `local-${Date.now()}`,
      requesterName: 'Amit Patel',
      requesterAvatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      coinAmount: 50,
      receivedAt: new Date(),
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
  }));

  if (!Env.devMode || role !== UserRole.Female) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.fab, animatedStyle, dragging && styles.fabDragging]}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Simulate incoming chat request"
        onPress={trigger}
        style={styles.pressable}
      >
        <Text style={styles.bolt}>⚡</Text>
        <View style={styles.labelBubble}>
          <Text style={styles.labelText}>DEV</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: AppColors.coinGoldDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  fabDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: { fontSize: 24, color: '#fff' },
  labelBubble: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: AppColors.error,
    borderRadius: AppRadii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  labelText: {
    ...AppTypography.labelSmall,
    color: '#fff',
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.4,
  },
});

export default DevSimulateChatFab;
