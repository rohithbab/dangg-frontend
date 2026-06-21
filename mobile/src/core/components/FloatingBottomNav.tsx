import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

import { AppColors } from '@theme/colors';

const BAR_HEIGHT = 64;
const INDICATOR_HEIGHT = 4;
const INDICATOR_WIDTH = 24;

type TabBarIconFn = (props: { focused: boolean; color: string; size: number }) => React.ReactNode;

function resolveIcon(option: unknown): TabBarIconFn | null {
  return typeof option === 'function' ? (option as TabBarIconFn) : null;
}

type TabButtonProps = {
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
  renderIcon: TabBarIconFn | null;
};

/** Tab button — icon only, with an active scale bump and accent color. */
function TabButton({
  active,
  onPress,
  onLongPress,
  renderIcon,
}: TabButtonProps): React.ReactElement {
  const color = active ? AppColors.primary : AppColors.onSurfaceMuted;

  const scale = useSharedValue(active ? 1.1 : 1);
  useEffect(() => {
    scale.value = withSpring(active ? 1.1 : 1, { damping: 10, stiffness: 150 });
  }, [active, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <Animated.View style={animatedIconStyle}>
        {renderIcon ? renderIcon({ focused: active, color, size: 24 }) : null}
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
  const tabWidth = barWidth / Math.max(1, state.routes.length);

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
      {/* Floating Pill Container with locked layout width */}
      <View style={[styles.pillBar, { width: barWidth }]}>
        {/* Gradient Background */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#1D1D24" stopOpacity={0.94} />
                <Stop offset="100%" stopColor="#101015" stopOpacity={0.97} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              rx={BAR_HEIGHT / 2}
              ry={BAR_HEIGHT / 2}
              fill="url(#navGradient)"
            />
          </Svg>
        </View>

        {/* Sliding Liquid Indicator */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {/* Tab Buttons Row */}
        {state.routes.map((route, idx) => {
          const options = descriptors[route.key]?.options;
          const iconRenderer = resolveIcon(options?.tabBarIcon);
          return (
            <TabButton
              key={`button-${route.key}`}
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
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    maxWidth: 600, // prevent overly wide layouts on tablets
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    // Premium soft floating shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
