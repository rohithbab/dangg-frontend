import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { WC, WR, WShadow } from '../walletTheme';

export type SliderTabsProps<T extends string> = {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
};

/**
 * Two-segment pill toggle with a spring-animated active background.
 *
 * Generic over the value type so callers can use a string union for the
 * tab key without losing type safety on the `onChange` callback.
 */
function SliderTabs<T extends string>({
  options,
  value,
  onChange,
}: SliderTabsProps<T>): React.ReactElement {
  const activeIndex = Math.max(
    0,
    options.findIndex(o => o.value === value),
  );
  const indicatorOffset = useSharedValue(activeIndex);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    indicatorOffset.value = withSpring(activeIndex, { damping: 18, stiffness: 200 });
  }, [activeIndex, indicatorOffset]);

  const indicatorStyle = useAnimatedStyle(() => {
    const segmentWidth = trackWidth.value / options.length;
    return {
      width: segmentWidth - INDICATOR_PADDING * 2,
      transform: [{ translateX: indicatorOffset.value * segmentWidth + INDICATOR_PADDING }],
    };
  }, [options.length]);

  const handleLayout = (e: LayoutChangeEvent): void => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.track} onLayout={handleLayout}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {options.map(opt => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(opt.value)}
            style={styles.segment}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const INDICATOR_PADDING = 4;
const TRACK_HEIGHT = 46;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    borderRadius: WR.md,
    backgroundColor: WC.surface,
    borderWidth: 1,
    borderColor: WC.hairline,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_PADDING,
    bottom: INDICATOR_PADDING,
    borderRadius: WR.sm,
    backgroundColor: WC.cardHi,
    ...WShadow.card,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelActive: { color: WC.text },
  labelInactive: { color: WC.textDim },
});

export default SliderTabs;
