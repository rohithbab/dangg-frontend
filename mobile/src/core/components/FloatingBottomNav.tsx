import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppTypography } from '@theme/typography';

const BAR_HEIGHT = 64;
const INDICATOR_HEIGHT = 4;
const INDICATOR_WIDTH = 24;

type TabBarIconFn = (props: { focused: boolean; color: string; size: number }) => React.ReactNode;

function resolveLabel(option: unknown, fallback: string): string {
  if (typeof option === 'string') {
    return option;
  }
  return fallback;
}

function resolveIcon(option: unknown): TabBarIconFn | null {
  return typeof option === 'function' ? (option as TabBarIconFn) : null;
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
  renderIcon: TabBarIconFn | null;
};

/** Tab button — displays active label inside the top, and animates icon scale and position. */
function TabButton({
  label,
  active,
  onPress,
  onLongPress,
  renderIcon,
}: TabButtonProps): React.ReactElement {
  const color = active ? AppColors.primary : AppColors.onSurfaceMuted;

  // Icon bounce & scale animation
  const scale = useSharedValue(active ? 1.15 : 1);
  useEffect(() => {
    scale.value = withSpring(active ? 1.15 : 1, { damping: 10, stiffness: 150 });
  }, [active, scale]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const translateY = withSpring(active ? 6 : 0, { damping: 12, stiffness: 120 });
    return {
      transform: [{ scale: scale.value }, { translateY }],
    };
  });

  // Label opacity and slide animation inside the top of the button
  const opacity = useSharedValue(active ? 1 : 0);
  const labelY = useSharedValue(active ? 0 : 4);
  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: 180 });
    labelY.value = withSpring(active ? 0 : 4, { damping: 12, stiffness: 120 });
  }, [active, opacity, labelY]);

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      {/* Label sitting inside the button at the top */}
      <Animated.Text style={[styles.labelText, animatedLabelStyle]}>{label}</Animated.Text>

      {/* Icon centered / shifted */}
      <Animated.View style={animatedIconStyle}>
        {renderIcon ? renderIcon({ focused: active, color, size: 22 }) : null}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating Pill Bottom Navigation Bar.
 *
 * Replaces the traditional concave-notch speedbreaker bar with a modern capsule-shaped
 * floating pill. Implements liquid stretch animations for the active tab indicator and
 * shows active labels directly inside the top of the bar.
 */
function FloatingBottomNav({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const containerPaddingBottom = insets.bottom + 8;
  const barWidth = width - 48; // horizontal margin of 24 on each side
  const tabWidth = barWidth / 3;

  const baseIndicatorLeft = (tabWidth - INDICATOR_WIDTH) / 2;

  // Liquid spring horizontal stretch trackers
  const leftPos = useSharedValue(state.index * tabWidth);
  const rightPos = useSharedValue(state.index * tabWidth);
  const prevIndex = useRef(state.index);

  useEffect(() => {
    const targetX = state.index * tabWidth;
    if (state.index > prevIndex.current) {
      // Moving right: right edge stretches forward first, left edge follows
      rightPos.value = withSpring(targetX, { damping: 14, stiffness: 110 });
      leftPos.value = withDelay(40, withSpring(targetX, { damping: 14, stiffness: 110 }));
    } else if (state.index < prevIndex.current) {
      // Moving left: left edge stretches forward first, right edge follows
      leftPos.value = withSpring(targetX, { damping: 14, stiffness: 110 });
      rightPos.value = withDelay(40, withSpring(targetX, { damping: 14, stiffness: 110 }));
    } else {
      leftPos.value = targetX;
      rightPos.value = targetX;
    }
    prevIndex.current = state.index;
  }, [state.index, tabWidth, leftPos, rightPos]);

  // Liquid indicator animation style
  const indicatorStyle = useAnimatedStyle(() => {
    const currentLeft = Math.min(leftPos.value, rightPos.value) + baseIndicatorLeft;
    const currentWidth = INDICATOR_WIDTH + Math.abs(rightPos.value - leftPos.value);
    return {
      left: currentLeft,
      width: currentWidth,
    };
  });

  const handlePress = (routeName: string, routeKey: string): void => {
    const isFocused = state.routes[state.index]?.name === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleLongPress = (routeKey: string): void => {
    navigation.emit({ type: 'tabLongPress', target: routeKey });
  };

  return (
    <View
      style={[styles.container, { paddingBottom: containerPaddingBottom }]}
      pointerEvents="box-none"
    >
      {/* Floating White Pill Container with locked layout width */}
      <View style={[styles.pillBar, { width: barWidth }]}>
        {/* Sliding Liquid Indicator */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {/* Tab Buttons Row */}
        {state.routes.map((route, idx) => {
          const options = descriptors[route.key]?.options;
          const label = resolveLabel(options?.tabBarLabel, route.name);
          const iconRenderer = resolveIcon(options?.tabBarIcon);
          return (
            <TabButton
              key={`button-${route.key}`}
              label={label}
              active={state.index === idx}
              onPress={() => handlePress(route.name, route.key)}
              onLongPress={() => handleLongPress(route.key)}
              renderIcon={iconRenderer}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  pillBar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: AppColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    maxWidth: 600, // prevent overly wide layouts on tablets
    // Soft glowing pink shadow
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: AppColors.primaryLight,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  labelText: {
    position: 'absolute',
    top: 8,
    ...AppTypography.labelSmall,
    fontWeight: '700',
    color: AppColors.primary,
    fontSize: 10,
  },
  indicator: {
    position: 'absolute',
    bottom: 6,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: AppColors.primary,
  },
});

export default FloatingBottomNav;
