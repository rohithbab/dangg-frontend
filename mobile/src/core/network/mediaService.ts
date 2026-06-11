/**
 * Cloudflare R2 uploads via the `media-sign` Edge Function.
 *
 * Flow (no bytes ever touch our backend):
 *   1. `media-sign` returns a short-lived presigned PUT URL. The server owns
 *      the object key — always under the caller's own `{uid}/` folder.
 *   2. We PUT the file bytes straight to R2.
 *
 * `publicUrl` is non-null only for public categories AND when the backend has
 * `R2_PUBLIC_BASE_URL` configured (r2.dev / custom domain). Private categories
 * (verification, reports) always return null — they're read via presigned GET.
 */
import { logger } from '@core/utils/logger';

import { mapSupabaseError } from './apiErrorMapper';
import { AppException } from './apiException';
import { getSupabaseClient } from './supabaseClient';

export type MediaCategory = 'profile' | 'gallery' | 'verification' | 'chat' | 'reports';

export type MediaUploadResult = { objectKey: string; publicUrl: string | null };

type SignResponse = { data?: { uploadUrl: string; objectKey: string; publicUrl: string | null } };

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

/** Best-effort MIME from a file path. Defaults to image/jpeg (media-sign's allowlist). */
export function inferContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  return CONTENT_TYPE_BY_EXT[ext] ?? 'image/jpeg';
}

/**
 * Uploads a local file to R2 and returns its object key + (maybe) public URL.
 * Throws AppException on failure.
 */
export async function uploadToR2(
  category: MediaCategory,
  localPath: string,
  contentType: string = inferContentType(localPath),
  kind?: 'image' | 'video',
): Promise<MediaUploadResult> {
  const client = getSupabaseClient();

  const { data, error } = await client.functions.invoke('media-sign', {
    body: { category, contentType, ...(kind ? { kind } : {}) },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  const signed = (data as SignResponse)?.data;
  if (!signed?.uploadUrl) {
    throw new AppException('SERVER', 'Could not get an upload URL');
  }

  // RN-safe read: fetch the URI as an ArrayBuffer (Blob upload is unreliable on
  // React Native). file:// and http(s):// pass through; bare paths get file://.
  const fileUri = /^(file|https?):\/\//.test(localPath) ? localPath : `file://${localPath}`;
  const bytes = await fetch(fileUri).then(r => r.arrayBuffer());

  const put = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  });
  if (!put.ok) {
    logger.error('uploadToR2: PUT failed', { status: put.status, category });
    throw new AppException('SERVER', `Upload failed (${put.status})`);
  }

  logger.info('uploadToR2 ok', { category, objectKey: signed.objectKey });
  return { objectKey: signed.objectKey, publicUrl: signed.publicUrl };
}
