import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { InterFont } from '@theme/typography';

const BAR_HEIGHT = 72;
const BAR_RADIUS = 32;
const HORIZONTAL_MARGIN = 24;
const HIGHLIGHT_HEIGHT = 56;
const HIGHLIGHT_MAX_WIDTH = 76;
const ACTIVE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = '#9999A3';

type TabBarIconFn = (props: { focused: boolean; color: string; size: number }) => React.ReactNode;

function resolveIcon(option: unknown): TabBarIconFn | null {
  return typeof option === 'function' ? (option as TabBarIconFn) : null;
}

/**
 * Floating glass-pill bottom navigation — "DANGG · Neue".
 *
 * A dark translucent capsule with a hairline border that floats above the
 * home indicator. Each tab shows an icon + always-visible label; the active
 * tab sits inside a pink-bordered highlight that springs between positions.
 * Generic over any tab count (3 male tabs / 4 female tabs).
 */
function FloatingBottomNav({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const containerPaddingBottom = insets.bottom > 0 ? insets.bottom : 12;
  const barWidth = Math.min(width - HORIZONTAL_MARGIN * 2, 560);
  const tabCount = Math.max(1, state.routes.length);
  const tabWidth = barWidth / tabCount;
  const highlightWidth = Math.min(tabWidth - 18, HIGHLIGHT_MAX_WIDTH);

  const highlightLeft = useSharedValue(state.index * tabWidth + (tabWidth - highlightWidth) / 2);

  useEffect(() => {
    highlightLeft.value = withSpring(state.index * tabWidth + (tabWidth - highlightWidth) / 2, {
      // Snappy: high stiffness + low mass so the pill darts to the tapped tab.
      damping: 24,
      stiffness: 320,
      mass: 0.6,
    });
  }, [state.index, tabWidth, highlightWidth, highlightLeft]);

  const highlightStyle = useAnimatedStyle(() => ({ left: highlightLeft.value }));

  const handlePress = (routeName: string, routeKey: string, isFocused: boolean): void => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      style={[styles.container, { paddingBottom: containerPaddingBottom }]}
      pointerEvents="box-none"
    >
      <View style={[styles.pill, { width: barWidth }]}>
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="navGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#1F1F26" stopOpacity={0.97} />
                <Stop offset="100%" stopColor="#121216" stopOpacity={0.98} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill="url(#navGlass)"
            />
          </Svg>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[styles.highlight, { width: highlightWidth }, highlightStyle]}
        />

        {state.routes.map((route, idx) => {
          const isFocused = state.index === idx;
          const options = descriptors[route.key]?.options;
          const renderIcon = resolveIcon(options?.tabBarIcon);
          const rawLabel = options?.tabBarLabel ?? options?.title ?? route.name;
          const label = typeof rawLabel === 'string' ? rawLabel : route.name;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={() => handlePress(route.name, route.key, isFocused)}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.tab}
            >
              {renderIcon ? renderIcon({ focused: isFocused, color, size: 23 }) : null}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
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
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  highlight: {
    position: 'absolute',
    top: (BAR_HEIGHT - HIGHLIGHT_HEIGHT) / 2,
    height: HIGHLIGHT_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(220,48,143,0.5)',
    backgroundColor: 'rgba(220,48,143,0.18)',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11,
  },
});

export default FloatingBottomNav;
