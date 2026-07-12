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
  // React Native). file://, content:// (Android gallery) and http(s):// pass
  // through; bare paths get file://.
  const fileUri = /^(file|content|https?):\/\//.test(localPath) ? localPath : `file://${localPath}`;
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

/**
 * True when a stored media reference is a bare R2 object key (e.g.
 * `chat/images/{uid}/{uuid}.png`) that must be resolved to a presigned GET URL
 * before it can be displayed. Full http(s) URLs and `dev://` stubs pass through.
 */
export function isBareMediaKey(url: string | null | undefined): url is string {
  return !!url && !/^(https?|dev):\/\//.test(url);
}

type ReadSignResponse = { data?: { urls: Record<string, string>; expiresInSeconds: number } };

// Presigned GET URLs are ~1h; cache them and refresh a few minutes early so a
// long-lived screen never renders an expired URL.
const readUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Batch-resolves bare R2 object keys into short-lived presigned GET URLs via the
 * `media-sign-read` Edge Function, so private-bucket media (chat images/videos,
 * profile/gallery images) can be displayed without a public bucket. Cached +
 * deduped; returns a { key -> signedUrl } map (keys that fail to sign are
 * omitted). Never throws — on error it returns whatever is already cached.
 */
export async function signMediaReadUrls(keys: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const result: Record<string, string> = {};
  const missing = new Set<string>();
  for (const key of keys) {
    if (!key) {
      continue;
    }
    const cached = readUrlCache.get(key);
    if (cached && cached.expiresAt > now) {
      result[key] = cached.url;
    } else {
      missing.add(key);
    }
  }
  if (missing.size === 0) {
    return result;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.functions.invoke('media-sign-read', {
      body: { keys: [...missing] },
    });
    if (error) {
      throw error;
    }
    const payload = (data as ReadSignResponse)?.data;
    const urls = payload?.urls ?? {};
    const ttlMs = Math.max(((payload?.expiresInSeconds ?? 3600) - 300) * 1000, 60_000);
    const expiresAt = now + ttlMs;
    for (const [key, url] of Object.entries(urls)) {
      readUrlCache.set(key, { url, expiresAt });
      result[key] = url;
    }
  } catch (e) {
    logger.warn('signMediaReadUrls failed', e);
  }
  return result;
}
