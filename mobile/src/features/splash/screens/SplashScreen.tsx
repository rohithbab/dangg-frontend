import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';

import { type AuthStackParamList } from '@navigation/types';

const TOTAL_MS = 3500;

type SplashNav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

// Traced SVG Paths from the WhatsApp video frames (epsilon=1.5, normalized to local dimensions)
const D_PATH =
  'M 1,0 L 0,184 L 100,184 L 129,176 L 151,162 L 158,152 L 162,150 L 166,140 L 168,140 L 176,115 L 178,98 L 176,70 L 172,55 L 158,30 L 135,12 L 105,2 L 87,0 Z M 60,77 L 93,77 L 110,80 L 118,88 L 118,98 L 112,104 L 98,108 L 59,108 L 58,78 Z';

const PLANE_LEFT_WING =
  'M 78,0 L 60,34 L 58,34 L 56,42 L 54,42 L 14,120 L 12,120 L 12,124 L 10,124 L 7,130 L 8,132 L 6,132 L 0,143 L 0,149 L 5,154 L 11,154 L 19,150 L 26,146 L 26,144 L 30,144 L 30,142 L 41,138 L 48,134 L 48,132 L 59,128 L 75,118 Z';

const PLANE_RIGHT_WING =
  'M 88,0 L 86,6 L 84,119 L 106,132 L 106,134 L 116,138 L 119,142 L 132,148 L 138,154 L 145,158 L 152,158 L 156,154 L 154,141 L 146,128 L 146,124 L 144,124 L 144,120 L 142,120 L 142,116 L 140,116 L 138,107 L 132,98 L 130,90 L 128,90 L 126,81 L 120,72 L 120,68 L 118,68 L 118,64 L 116,64 L 116,60 L 108,46 L 108,42 L 106,42 L 106,38 L 104,38 L 104,34 L 102,34 L 100,25 L 94,16 Z';

const N_PATH =
  'M 93,0 L 78,8 L 68,21 L 64,30 L 64,36 L 62,36 L 60,54 L 55,54 L 55,52 L 59,4 L 0,4 L 0,134 L 58,134 L 54,80 L 58,68 L 64,62 L 70,61 L 82,62 L 86,66 L 90,78 L 84,134 L 144,134 L 144,45 L 140,24 L 134,12 L 124,4 L 114,0 Z';

const G1_PATH =
  'M 64,0 L 45,4 L 30,10 L 15,22 L 9,32 L 7,54 L 15,70 L 22,76 L 25,76 L 25,78 L 33,80 L 33,82 L 51,86 L 52,90 L 49,92 L 17,84 L 1,135 L 0,152 L 5,171 L 14,182 L 23,188 L 36,192 L 50,192 L 69,186 L 98,160 L 108,160 L 111,163 L 111,180 L 107,188 L 162,188 L 167,168 L 169,146 L 167,127 L 163,117 L 156,108 L 140,100 L 110,100 L 100,104 L 85,114 L 85,116 L 79,118 L 79,120 L 65,124 L 55,118 L 55,106 L 57,106 L 61,94 L 99,94 L 111,92 L 123,88 L 139,78 L 145,68 L 147,56 L 143,41 L 131,29 L 131,26 L 136,26 L 171,58 L 171,4 L 133,2 L 129,0 Z M 73,58 L 87,58 L 99,62 L 103,69 L 101,76 L 93,80 L 69,80 L 63,78 L 59,74 L 59,66 L 65,60 Z';

const G2_PATH =
  'M 64,0 L 45,4 L 30,10 L 15,22 L 9,32 L 7,55 L 12,66 L 25,78 L 38,84 L 51,86 L 52,90 L 47,92 L 46,90 L 17,84 L 1,134 L 0,154 L 5,171 L 15,183 L 23,188 L 36,192 L 49,192 L 69,186 L 97,160 L 107,160 L 111,164 L 111,178 L 107,188 L 162,188 L 165,168 L 167,166 L 167,128 L 161,114 L 153,106 L 140,100 L 110,100 L 95,107 L 91,112 L 79,118 L 79,120 L 69,123 L 59,122 L 55,118 L 55,106 L 61,94 L 98,94 L 110,92 L 123,88 L 139,78 L 145,68 L 145,46 L 138,34 L 131,30 L 131,26 L 139,28 L 151,42 L 171,58 L 171,4 L 133,2 L 129,0 Z M 74,58 L 87,58 L 99,62 L 103,69 L 101,75 L 93,80 L 68,80 L 63,78 L 59,74 L 60,64 L 65,62 L 65,60 Z';

const TAGLINE_LETTERS = 'TALK WITH LOVE'.split('');

interface TaglineLetterProps {
  char: string;
  index: number;
  progress: Animated.SharedValue<number>;
  scale: number;
}

// Single character component for staggered typewriter animation
function TaglineLetter({ char, index, progress, scale }: TaglineLetterProps): React.ReactElement {
  const letterStyle = useAnimatedStyle(() => {
    const total = TAGLINE_LETTERS.length;
    const start = index / total;
    const end = Math.min(1, (index + 1) / total);
    const opacity = interpolate(progress.value, [start, end], [0, 1], 'clamp');
    return { opacity };
  });

  return (
    <Animated.Text
      style={[
        styles.taglineChar,
        {
          fontSize: 22 * scale,
        },
        letterStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

function SplashScreen(): React.ReactElement {
  const navigation = useNavigation<SplashNav>();
  const naveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Layout math setup for responsive scaling
  const { width: screenWidth } = useWindowDimensions();
  const designWidth = 857;
  const designHeight = 242;
  const scale = (screenWidth * 0.85) / designWidth;

  // Animated shared values matching the precise timing coordinates
  const dProgress = useSharedValue(0);
  const planeProgress = useSharedValue(0);
  const nProgress = useSharedValue(0);
  const g1Progress = useSharedValue(0);
  const g2Progress = useSharedValue(0);
  const taglineProgress = useSharedValue(0);

  useEffect(() => {
    // 0.5s - 1.2s: D scales up snappily and settles with overshoot
    dProgress.value = withDelay(
      500,
      withTiming(1, {
        duration: 700,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
    );

    // 1.2s - 1.7s: Paper plane glides in from bottom-right and lands in slot
    planeProgress.value = withDelay(
      1200,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }),
    );

    // 1.6s - 2.0s: letter 'n' scales up and fades in
    nProgress.value = withDelay(
      1600,
      withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
    );

    // 1.8s - 2.2s: first 'g' scales up and fades in
    g1Progress.value = withDelay(
      1800,
      withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
    );

    // 2.0s - 2.4s: second 'g' scales up and fades in
    g2Progress.value = withDelay(
      2000,
      withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
    );

    // 1.6s - 2.4s: Tagline typewriter fades in
    taglineProgress.value = withDelay(
      1600,
      withTiming(1, {
        duration: 800,
        easing: Easing.linear,
      }),
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
  }, [navigation, dProgress, planeProgress, nProgress, g1Progress, g2Progress, taglineProgress]);

  // Interpolated animated styles for logo elements
  const dStyle = useAnimatedStyle(() => ({
    opacity: dProgress.value,
    transform: [{ scale: dProgress.value }],
  }));

  const planeStyle = useAnimatedStyle(() => {
    const p = planeProgress.value;
    // Quadratic Bezier curve matching the user's envelope/string-art curve reference:
    // Starts horizontal at bottom-right (300, 200) and ends vertical at top-left (0, 0)
    // Control point is at bottom-left (0, 200)
    // Formula: B(p) = (1-p)^2 * P0 + 2(1-p)p * P1 + p^2 * P2
    // Translations scaled by the design layout scale factor to keep trajectory relative
    const translateX = 300 * Math.pow(1 - p, 2) * scale;
    const translateY = 200 * (1 - Math.pow(p, 2)) * scale;
    const scaleVal = interpolate(p, [0, 1], [1.4, 1]);
    // Rotate from -90 degrees (pointing left) to 0 degrees (pointing up) to align with path tangent
    const rotate = interpolate(p, [0, 1], [-90, 0]);

    return {
      opacity: p,
      transform: [{ translateX }, { translateY }, { scale: scaleVal }, { rotate: `${rotate}deg` }],
    };
  });

  const nStyle = useAnimatedStyle(() => ({
    opacity: nProgress.value,
    transform: [{ scale: nProgress.value }],
  }));

  const g1Style = useAnimatedStyle(() => ({
    opacity: g1Progress.value,
    transform: [{ scale: g1Progress.value }],
  }));

  const g2Style = useAnimatedStyle(() => ({
    opacity: g2Progress.value,
    transform: [{ scale: g2Progress.value }],
  }));

  const activeBg = AppColors.splashBackground;

  // Compute scaled positions for canvas layout to avoid blurry view-transform scaling
  const canvasWidth = designWidth * scale;
  const canvasHeight = designHeight * scale;

  return (
    <View style={[styles.root, { backgroundColor: activeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={activeBg} translucent={false} />
      <View style={styles.centerWrapper}>
        {/* Aspect Ratio Canvas holding absolute elements scaled together */}
        <View
          style={[
            styles.canvas,
            {
              width: canvasWidth,
              height: canvasHeight,
            },
          ]}
        >
          {/* Letter D */}
          <Animated.View
            style={[
              styles.element,
              {
                left: 0 * scale,
                top: 0 * scale,
                width: 177 * scale,
                height: 183 * scale,
              },
              dStyle,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 177 183">
              <Path d={D_PATH} fill="white" fillRule="evenodd" />
            </Svg>
          </Animated.View>

          {/* Paper Plane 'a' */}
          <Animated.View
            style={[
              styles.element,
              {
                left: 172 * scale,
                top: 30 * scale,
                width: 156 * scale,
                height: 158 * scale,
              },
              planeStyle,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 156 158">
              <Path d={PLANE_LEFT_WING} fill="white" />
              <Path d={PLANE_RIGHT_WING} fill="white" />
            </Svg>
          </Animated.View>

          {/* Letter n */}
          <Animated.View
            style={[
              styles.element,
              {
                left: 344 * scale,
                top: 50 * scale,
                width: 144 * scale,
                height: 134 * scale,
              },
              nStyle,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 144 134">
              <Path d={N_PATH} fill="white" />
            </Svg>
          </Animated.View>

          {/* Letter g1 */}
          <Animated.View
            style={[
              styles.element,
              {
                left: 503 * scale,
                top: 50 * scale,
                width: 171 * scale,
                height: 192 * scale,
              },
              g1Style,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 171 192">
              <Path d={G1_PATH} fill="white" fillRule="evenodd" />
            </Svg>
          </Animated.View>

          {/* Letter g2 */}
          <Animated.View
            style={[
              styles.element,
              {
                left: 687 * scale,
                top: 50 * scale,
                width: 171 * scale,
                height: 192 * scale,
              },
              g2Style,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 171 192">
              <Path d={G2_PATH} fill="white" fillRule="evenodd" />
            </Svg>
          </Animated.View>

          {/* Tagline "TALK WITH LOVE" */}
          <View
            style={[
              styles.taglineRow,
              {
                left: 41 * scale,
                top: 207 * scale,
                width: 432 * scale,
                height: 35 * scale,
              },
            ]}
          >
            {TAGLINE_LETTERS.map((char, index) => {
              if (char === ' ') {
                return <View key={index} style={{ width: 14 * scale }} />;
              }
              return (
                <TaglineLetter
                  key={index}
                  char={char}
                  index={index}
                  progress={taglineProgress}
                  scale={scale}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'relative',
  },
  element: {
    position: 'absolute',
  },
  taglineRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taglineChar: {
    fontWeight: '800',
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default SplashScreen;
