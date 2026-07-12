/**
 * Chat media attachments — pick from camera/gallery, upload to R2, send.
 *
 * The picker (react-native-image-picker) handles the camera/gallery permission
 * prompts itself. Bytes go straight to R2 via uploadToR2('chat', …); only the
 * resulting public URL is persisted on the chat_messages row.
 */
import { type Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { uploadToR2 } from '@core/network/mediaService';
import { logger } from '@core/utils/logger';

import { type ChatMessage, sendChatMediaMessage } from './chatRequestApi';

export type ChatMediaSource = 'camera-photo' | 'camera-video' | 'gallery';

export type PickedChatMedia = {
  uri: string;
  kind: 'image' | 'video';
  fileName: string;
  type: string;
};

function assetToPicked(asset: Asset | undefined): PickedChatMedia | null {
  if (!asset?.uri) {
    return null;
  }
  const isVideo = (asset.type ?? '').startsWith('video') || asset.duration != null;
  return {
    uri: asset.uri,
    kind: isVideo ? 'video' : 'image',
    fileName: asset.fileName ?? `chat-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
    type: asset.type ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
  };
}

/**
 * Opens the camera or gallery and returns the chosen asset, or null if the user
 * cancelled or the pick failed (permission denied, unavailable, etc.).
 */
export async function pickChatMedia(source: ChatMediaSource): Promise<PickedChatMedia | null> {
  try {
    const result =
      source === 'gallery'
        ? await launchImageLibrary({
            mediaType: 'mixed',
            selectionLimit: 1,
            quality: 0.8,
            videoQuality: 'low',
          })
        : source === 'camera-video'
          ? await launchCamera({ mediaType: 'video', videoQuality: 'low', saveToPhotos: false })
          : await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false });

    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      logger.warn('pickChatMedia failed', { source, errorCode: result.errorCode });
      return null;
    }
    return assetToPicked(result.assets?.[0]);
  } catch (e) {
    logger.warn('pickChatMedia threw', e);
    return null;
  }
}

/**
 * Uploads a picked asset to R2 and inserts the chat message. Returns the sent
 * message (the realtime echo is de-duped by id in the screens).
 */
export async function uploadAndSendChatMedia(
  sessionId: string,
  picked: PickedChatMedia,
): Promise<ChatMessage> {
  const { publicUrl, objectKey } = await uploadToR2('chat', picked.uri, picked.type, picked.kind);
  // Public 'chat' category returns a CDN URL; fall back to the key (same shape
  // profileApi relies on) if R2_PUBLIC_BASE_URL isn't set server-side.
  const url = publicUrl ?? objectKey;
  return sendChatMediaMessage(sessionId, url, picked.kind);
}
