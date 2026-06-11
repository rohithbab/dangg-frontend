import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { AppColors } from '@theme/colors';

type CoinIconProps = {
  size?: number;
};

/**
 * Dangg brand coin — gold disc with a minted rim, an inner ring, and a bold
 * serif "D" flanked by three short bars on each side. Used everywhere coins
 * are shown so the currency reads identically across the app.
 *
 * Render-size-agnostic: all geometry lives in the 24×24 viewBox, so it
 * scales crisply at any `size`.
 */
function CoinIcon({ size = 20 }: CoinIconProps): React.ReactElement {
  // Unique gradient id per render so two icons in the same screen don't
  // clobber each other's <Defs>.
  const faceId = React.useId();
  const rimId = React.useId();

  // Bar geometry — three horizontal bars on each side of the D.
  const barWidth = 2.8;
  const barHeight = 0.7;
  const barLeftX = 3.2;
  const barRightX = 24 - 3.2 - barWidth;
  const barCenterY = 12;
  const barGap = 1.4;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={AppColors.coinGoldLight} />
          <Stop offset="0.55" stopColor={AppColors.coinGold} />
          <Stop offset="1" stopColor={AppColors.coinGoldDark} />
        </LinearGradient>
        <LinearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={AppColors.coinGoldDark} />
          <Stop offset="1" stopColor={AppColors.coinGold} />
        </LinearGradient>
      </Defs>

      {/* Outer rim (minted edge) */}
      <Circle cx={12} cy={12} r={11.5} fill={`url(#${rimId})`} />
      {/* Gradient face inside the rim */}
      <Circle cx={12} cy={12} r={10.3} fill={`url(#${faceId})`} />
      {/* Inner ring — a thin darker line just inside the rim */}
      <Circle
        cx={12}
        cy={12}
        r={9.4}
        fill="none"
        stroke={AppColors.coinGoldDark}
        strokeOpacity={0.55}
        strokeWidth={0.35}
      />

      {/* Left bars */}
      <Rect
        x={barLeftX}
        y={barCenterY - barGap - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />
      <Rect
        x={barLeftX}
        y={barCenterY - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />
      <Rect
        x={barLeftX}
        y={barCenterY + barGap - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />

      {/* Right bars */}
      <Rect
        x={barRightX}
        y={barCenterY - barGap - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />
      <Rect
        x={barRightX}
        y={barCenterY - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />
      <Rect
        x={barRightX}
        y={barCenterY + barGap - barHeight / 2}
        width={barWidth}
        height={barHeight}
        rx={0.3}
        fill={AppColors.coinGoldDark}
      />

      {/* The bold serif "D" in the center */}
      <SvgText
        x={12}
        y={16.2}
        fontSize={13}
        fontFamily="serif"
        fontWeight="900"
        fill={AppColors.coinGoldDark}
        textAnchor="middle"
      >
        D
      </SvgText>
    </Svg>
  );
}

export default CoinIcon;
