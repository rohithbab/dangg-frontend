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

// Brand logo SVG paths, normalized to local dimensions. Originally traced from the
// WhatsApp video frames as polygons, then re-smoothed into corner-preserving cubic
// Bézier curves (RDP simplify + Catmull-Rom handles) so curves render crisp on HiDPI
// displays while intentional corners (plane tip, letter stems) stay sharp.
const D_PATH =
  'M 1,0 C 0.83,30.67 0.17,153.33 0,184 C 16.67,184 78.5,185.33 100,184 C 121.5,182.67 120.5,179.67 129,176 C 137.5,172.33 144.5,168 151,162 C 157.5,156 163.5,150.67 168,140 C 172.5,129.33 177.33,112.17 178,98 C 178.67,83.83 175.33,66.33 172,55 C 168.67,43.67 164.17,37.17 158,30 C 151.83,22.83 143.83,16.67 135,12 C 126.17,7.33 127.33,4 105,2 C 82.67,0 18.33,0.33 1,0 Z M 60,77 C 68.33,77.5 101.67,79.5 110,80 C 111.33,81.33 116.67,86.67 118,88 C 118,89.67 118,96.33 118,98 C 117,99 115.33,102.33 112,104 C 108.67,105.67 106.83,107.33 98,108 C 89.17,108.67 65.5,108 59,108 C 59.17,102.83 59.83,82.17 60,77 Z';

const PLANE_LEFT_WING =
  'M 78,0 C 65,23.83 13,118.17 0,143 C -13,167.83 0,148 0,149 C 0.83,149.83 4.17,153.17 5,154 C 7.33,153.33 7.33,156 19,150 C 30.67,144 65.67,123.33 75,118 C 75.5,98.33 77.5,19.67 78,0 Z';

const PLANE_RIGHT_WING =
  'M 88,0 C 87.33,19.83 84.67,99.17 84,119 C 93,124.83 126.67,147.5 138,154 C 149.33,160.5 149.67,157.33 152,158 C 152.67,157.33 155.33,154.67 156,154 C 155.67,151.83 165.33,166.67 154,141 C 142.67,115.33 99,23.5 88,0 Z';

const N_PATH =
  'M 93,0 C 87,1.33 82.17,4.5 78,8 C 73.83,11.5 70.67,16.33 68,21 C 65.33,25.67 63.33,30.5 62,36 C 60.67,41.5 60.33,51 60,54 C 59.17,54 55.83,54 55,54 C 55.67,45.67 58.33,12.33 59,4 C 49.17,4 9.83,4 0,4 C 0,25.67 0,112.33 0,134 C 9.67,134 48.33,134 58,134 C 57.33,125 54,91 54,80 C 54,69 57.33,70 58,68 C 60,66.83 66,62 70,61 C 74,60 80,61.83 82,62 C 83.33,64.67 89.67,66 90,78 C 90.33,90 85,124.67 84,134 C 94,134 134,134 144,134 C 144,119.17 144.67,63.33 144,45 C 143.33,26.67 141.67,29.5 140,24 C 138.33,18.5 136.67,15.33 134,12 C 131.33,8.67 127.33,6 124,4 C 120.67,2 119.17,0.67 114,0 C 108.83,-0.67 99,-1.33 93,0 Z';

const G1_PATH =
  'M 64,0 C 47.5,1.67 38.17,6.33 30,10 C 21.83,13.67 18.5,18.33 15,22 C 11.5,25.67 10.33,26.67 9,32 C 7.67,37.33 6,47.67 7,54 C 8,60.33 10.67,65.33 15,70 C 19.33,74.67 27,79.33 33,82 C 39,84.67 48,85.33 51,86 C 51.17,86.67 51.83,89.33 52,90 C 51.5,90.33 49.5,91.67 49,92 C 43.67,90.67 22.33,85.33 17,84 C 14.33,92.5 3.83,123.67 1,135 C -1.83,146.33 -0.67,146 0,152 C 0.67,158 1.17,165 5,171 C 8.83,177 15.5,184.5 23,188 C 30.5,191.5 42.33,192.33 50,192 C 57.67,191.67 61,191.33 69,186 C 77,180.67 93.17,164.33 98,160 C 99.67,160 106.33,160 108,160 C 108.5,160.5 110.5,162.5 111,163 C 111,165.83 111.67,175.83 111,180 C 110.33,184.17 107.67,186.67 107,188 C 116.17,188 152.83,188 162,188 C 163.17,181 168.17,156.17 169,146 C 169.83,135.83 169.17,133.33 167,127 C 164.83,120.67 160.5,112.5 156,108 C 151.5,103.5 147.67,101.33 140,100 C 132.33,98.67 120.17,96.67 110,100 C 99.83,103.33 86.5,116 79,120 C 71.5,124 67.33,123.33 65,124 C 63.33,123 56.67,119 55,118 C 55,116 54,110 55,106 C 56,102 60,96 61,94 C 69.33,93.67 98,94.67 111,92 C 124,89.33 133.33,82 139,78 C 144.67,74 143.67,71.67 145,68 C 146.33,64.33 147.33,60.5 147,56 C 146.67,51.5 145.67,46 143,41 C 140.33,36 133,28.5 131,26 C 131.83,26 135.17,26 136,26 C 141.83,31.33 165.17,52.67 171,58 C 171,49 171,13 171,4 C 164,3.33 146.83,0.67 129,0 C 111.17,-0.67 80.5,-1.67 64,0 Z M 73,58 C 78.67,58.33 94.67,61.33 99,62 C 99.67,63.17 102.33,67.83 103,69 C 102.67,70.17 101.33,74.83 101,76 C 99.67,76.67 99.33,79.67 93,80 C 86.67,80.33 68,78.33 63,78 C 62.33,77.33 59.67,74.67 59,74 C 59,72.67 59,67.33 59,66 C 60,65 62.67,61.33 65,60 C 67.33,58.67 67.33,57.67 73,58 Z';

const G2_PATH =
  'M 64,0 C 47.5,1.67 38.17,6.33 30,10 C 21.83,13.67 18.5,18.33 15,22 C 11.5,25.67 10.33,26.5 9,32 C 7.67,37.5 6.5,49.33 7,55 C 7.5,60.67 9,62.17 12,66 C 15,69.83 18.5,74.67 25,78 C 31.5,81.33 46.67,84.67 51,86 C 51.17,86.67 51.83,89.33 52,90 C 51.17,90.33 52.83,93 47,92 C 41.17,91 22,85.33 17,84 C 14.33,92.33 3.83,122.33 1,134 C -1.83,145.67 -0.67,147.83 0,154 C 0.67,160.17 1.17,165.33 5,171 C 8.83,176.67 15.67,184.5 23,188 C 30.33,191.5 41.33,192.33 49,192 C 56.67,191.67 61,191.33 69,186 C 77,180.67 92.33,164.33 97,160 C 98.67,160 105.33,160 107,160 C 107.67,160.67 110.33,163.33 111,164 C 111,166.33 111.67,174 111,178 C 110.33,182 107.67,186.33 107,188 C 116.17,188 152.83,188 162,188 C 162.83,184.33 166.17,176 167,166 C 167.83,156 168,136.67 167,128 C 166,119.33 163.33,117.67 161,114 C 158.67,110.33 156.5,108.33 153,106 C 149.5,103.67 147.17,101 140,100 C 132.83,99 117.5,98.83 110,100 C 102.5,101.17 100.17,103.67 95,107 C 89.83,110.33 83.33,117.33 79,120 C 74.67,122.67 72.33,122.67 69,123 C 65.67,123.33 60.67,122.17 59,122 C 58.33,121.33 55.67,118.67 55,118 C 55,116 54,110 55,106 C 56,102 60,96 61,94 C 69.17,93.67 97,94.67 110,92 C 123,89.33 133.17,82 139,78 C 144.83,74 144,73.33 145,68 C 146,62.67 146.17,51.67 145,46 C 143.83,40.33 140.33,36.67 138,34 C 135.67,31.33 132.17,30.67 131,30 C 131,29.33 131,26.67 131,26 C 132.33,26.33 132.33,22.67 139,28 C 145.67,33.33 165.67,53 171,58 C 171,49 171,13 171,4 C 164,3.33 146.83,0.67 129,0 C 111.17,-0.67 80.5,-1.67 64,0 Z M 74,58 C 80.5,57.67 94.83,61.33 99,62 C 99.67,63.17 102.33,67.83 103,69 C 102.67,70 101.33,74 101,75 C 99.67,75.83 99.33,79.5 93,80 C 86.67,80.5 68,78.33 63,78 C 62.33,77.33 59.67,74.67 59,74 C 59.17,72.33 59.83,65.67 60,64 C 62.33,63 67.5,58.33 74,58 Z';

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
    color: AppColors.onSurface,
    includeFontPadding: false,
    textAlignVertical: 'center',
    // Soft pink neon glow on the typewriter tagline.
    textShadowColor: AppColors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default SplashScreen;
