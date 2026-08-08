/**
 * Capture/pick constraints for every image the app uploads.
 *
 * Nothing downscaled before this existed: pickers ran with `quality` only, so
 * a modern phone camera handed us a 12MP, multi-megabyte JPEG — for an avatar
 * rendered in a 48pt circle. The cost is paid three times over:
 *
 *   * upload — megabytes over a mobile connection,
 *   * download — every viewer pays it again, on every cache miss,
 *   * decode — a 12MP bitmap is ~48MB of RAM. Glide's memory cache is a
 *     fraction of the heap, so a handful of avatars evict each other
 *     constantly and every scroll re-decodes from disk.
 *
 * That last point is what the alpha reviewer saw as "profile pictures take
 * noticeable time to load again after the app is idle": returning to
 * foreground drops the memory cache, and re-decoding oversized source images
 * is slow even when the bytes are already on disk.
 *
 * R2 is plain object storage with no transformation layer, so the resize has
 * to happen on the device. react-native-image-picker does it natively, before
 * the file is ever handed to JS.
 */

import { type PhotoQuality } from 'react-native-image-picker';

/** Avatars render at 48–108pt. 1024² stays sharp on a 3x display with room to spare. */
export const AVATAR_MAX_DIMENSION = 1024;

/** Chat photos can be opened full-screen, so they keep more detail. */
export const CHAT_IMAGE_MAX_DIMENSION = 1600;

/** Screenshots only need to be legible to a support agent. */
export const SCREENSHOT_MAX_DIMENSION = 1280;

/** JPEG quality shared by every upload path. */
export const UPLOAD_IMAGE_QUALITY: PhotoQuality = 0.8;

/** Spread into a react-native-image-picker call to bound the output. */
export function imageConstraints(maxDimension: number): {
  maxWidth: number;
  maxHeight: number;
  quality: PhotoQuality;
} {
  return {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
    quality: UPLOAD_IMAGE_QUALITY,
  };
}
