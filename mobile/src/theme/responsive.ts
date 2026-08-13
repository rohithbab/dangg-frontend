import { Dimensions, PixelRatio } from 'react-native';

/**
 * Responsive scaling.
 *
 * Sizes in this app are authored against a single baseline phone. Real devices
 * span a wide range of logical widths — many Samsung/Moto/Vivo handsets report
 * 360dp, the Pixel reference is ~412dp, small phones dip to 320dp — so a fixed
 * `padding: 16` / `fontSize: 16` looks cramped on narrow screens and loose on
 * wide ones. These helpers rescale a baseline size to the actual device so
 * padding, type, and line-height stay visually proportional everywhere.
 *
 * Computed once at module load from the device's SHORTER edge (= portrait
 * width, stable for our portrait-locked app). The ratio is clamped so tablets
 * and tiny phones stay in a sane band instead of ballooning or collapsing.
 */
const { width, height } = Dimensions.get('window');
const shortEdge = Math.min(width, height);
const longEdge = Math.max(width, height);

/** Baseline device the UI was tuned on (a common modern phone). */
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/** Keep scaling gentle at the extremes — no giant text on tablets, no
 *  unreadably small text on tiny phones. */
const RATIO_MIN = 0.85;
const RATIO_MAX = 1.2;

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/** Clamped width/height ratios vs. the baseline. */
export const widthRatio = clamp(shortEdge / BASE_WIDTH, RATIO_MIN, RATIO_MAX);
export const heightRatio = clamp(longEdge / BASE_HEIGHT, RATIO_MIN, RATIO_MAX);

/** Full linear scale by width — horizontal padding/margins, icon/box sizes. */
export const scale = (size: number): number => size * widthRatio;

/** Full linear scale by height — vertical rhythm where it genuinely matters. */
export const verticalScale = (size: number): number => size * heightRatio;

/**
 * Partial scale (default 50%) — the workhorse for padding and type. Blends the
 * baseline size with its fully-scaled value so a layout tuned on one device
 * adapts to others without distorting. `factor = 0` → no change, `factor = 1`
 * → full `scale`.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Font/line-height sizing — `moderateScale` snapped to the device pixel grid so
 * glyphs stay crisp. Call it for BOTH `fontSize` and `lineHeight` (same factor)
 * so leading scales in lock-step with the glyphs.
 */
export const scaleFont = (size: number): number =>
  PixelRatio.roundToNearestPixel(moderateScale(size, 0.5));
