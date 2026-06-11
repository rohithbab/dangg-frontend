import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';

// Traced SVG Paths from the Splash screen (accurate to the reference video)
const D_PATH =
  'M 1,0 L 0,184 L 100,184 L 129,176 L 151,162 L 158,152 L 162,150 L 166,140 L 168,140 L 176,115 L 178,98 L 176,70 L 172,55 L 158,30 L 135,12 L 105,2 L 87,0 Z M 60,77 L 93,77 L 110,80 L 118,88 L 118,98 L 112,104 L 98,108 L 59,108 L 59,78 Z';

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

export interface DanggLogoProps {
  /** Logo display width in density-independent pixels. Default is 180. */
  width?: number;
  /** Color fill for paths and tagline. Defaults to splash screen pink (AppColors.splashBackground). */
  color?: string;
  /** Whether to render the 'TALK WITH LOVE' tagline. Default is true. */
  showTagline?: boolean;
  /** Custom font size for the tagline. If provided, renders as centered Text to prevent clipping at small scales. */
  taglineFontSize?: number;
  /** Custom letter spacing for the tagline. Only applies when taglineFontSize is specified. */
  taglineLetterSpacing?: number;
}

export function DanggLogo({
  width = 180,
  color = AppColors.splashBackground,
  showTagline = true,
  taglineFontSize,
  taglineLetterSpacing,
}: DanggLogoProps): React.ReactElement {
  const designWidth = 857;
  const designHeight = showTagline ? 242 : 192;
  const scale = width / designWidth;

  const canvasWidth = designWidth * scale;
  const canvasHeight = designHeight * scale;

  return (
    <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
      {/* Letter D */}
      <View
        style={[
          styles.element,
          {
            left: 0 * scale,
            top: 0 * scale,
            width: 177 * scale,
            height: 183 * scale,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 177 183">
          <Path d={D_PATH} fill={color} fillRule="evenodd" />
        </Svg>
      </View>

      {/* Paper Plane 'a' */}
      <View
        style={[
          styles.element,
          {
            left: 172 * scale,
            top: 30 * scale,
            width: 156 * scale,
            height: 158 * scale,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 156 158">
          <Path d={PLANE_LEFT_WING} fill={color} />
          <Path d={PLANE_RIGHT_WING} fill={color} />
        </Svg>
      </View>

      {/* Letter n */}
      <View
        style={[
          styles.element,
          {
            left: 344 * scale,
            top: 50 * scale,
            width: 144 * scale,
            height: 134 * scale,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 144 134">
          <Path d={N_PATH} fill={color} />
        </Svg>
      </View>

      {/* Letter g1 */}
      <View
        style={[
          styles.element,
          {
            left: 503 * scale,
            top: 50 * scale,
            width: 171 * scale,
            height: 192 * scale,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 171 192">
          <Path d={G1_PATH} fill={color} fillRule="evenodd" />
        </Svg>
      </View>

      {/* Letter g2 */}
      <View
        style={[
          styles.element,
          {
            left: 687 * scale,
            top: 50 * scale,
            width: 171 * scale,
            height: 192 * scale,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 171 192">
          <Path d={G2_PATH} fill={color} fillRule="evenodd" />
        </Svg>
      </View>

      {/* Tagline "TALK WITH LOVE" */}
      {showTagline &&
        (taglineFontSize !== undefined ? (
          <View
            style={[
              styles.taglineRowCentered,
              {
                top: 205 * scale,
                width: 488 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.taglineText,
                {
                  fontSize: taglineFontSize,
                  color,
                  letterSpacing: taglineLetterSpacing ?? 2,
                },
              ]}
              numberOfLines={1}
            >
              TALK WITH LOVE
            </Text>
          </View>
        ) : (
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
                <Text
                  key={index}
                  style={[
                    styles.taglineChar,
                    {
                      fontSize: 22 * scale,
                      color,
                    },
                  ]}
                >
                  {char}
                </Text>
              );
            })}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  taglineRowCentered: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineChar: {
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  taglineText: {
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },
});

export default DanggLogo;
