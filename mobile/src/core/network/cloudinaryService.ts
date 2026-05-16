import { Env } from '../config/env';
import { logger } from '../utils/logger';

import { mapSupabaseError } from './apiErrorMapper';
import { ServerException } from './apiException';
import { getSupabaseClient } from './supabaseClient';

/** Signed Cloudinary upload params returned by the backend Edge Function. */
export type CloudinarySignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Direct-to-Cloudinary image upload.
 *
 * The app never holds Cloudinary's API secret. Instead:
 *   1. `fetchSignature()` — Edge Function `upload-signature` returns
 *      signature / timestamp / api_key / cloud_name.
 *   2. `uploadImage()` posts multipart-form-data to api.cloudinary.com with
 *      those signed params.
 *   3. Persist the returned `secure_url` in the relevant row.
 */
export const cloudinaryService = {
  /** Calls `upload-signature` Edge Function and returns signed params. */
  async fetchSignature(folder: string, userId: string): Promise<CloudinarySignature> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('upload-signature', {
        body: { folder, user_id: userId },
      });
      if (error) {
        throw mapSupabaseError(error);
      }
      if (typeof data !== 'object' || data === null) {
        throw new ServerException('Malformed signature response');
      }
      const raw = data as Record<string, unknown>;
      return {
        signature: String(raw.signature ?? ''),
        timestamp: Number(raw.timestamp ?? 0),
        apiKey: String(raw.api_key ?? ''),
        cloudName: String(raw.cloud_name ?? Env.cloudinaryCloudName),
        folder: String(raw.folder ?? folder),
      };
    } catch (e) {
      throw mapSupabaseError(e);
    }
  },

  /**
   * Uploads a local file URI to Cloudinary and returns its `secure_url`.
   *
   * TODO(network): replace stub with real multipart POST to
   * `https://api.cloudinary.com/v1_1/<cloudName>/image/upload`. The signing
   * contract is finalised; only the HTTP transport remains.
   */
  async uploadImage(
    localFileUri: string,
    fileName: string,
    signature: CloudinarySignature,
  ): Promise<string> {
    logger.debug(
      `cloudinaryService.uploadImage stub — would upload "${fileName}" (${localFileUri}) to ${signature.cloudName}/${signature.folder}`,
    );
    return '';
  },
};
