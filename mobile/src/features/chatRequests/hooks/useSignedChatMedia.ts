import { useEffect, useState } from 'react';

import { isBareMediaKey, signMediaReadUrls } from '@core/network/mediaService';

/**
 * Resolves bare R2 object keys carried on chat messages (e.g.
 * `chat/images/{uid}/{uuid}.png`) into short-lived presigned GET URLs via
 * `media-sign-read`, so FastImage can display private-bucket media. Full
 * http(s) URLs need no resolution and are ignored here.
 *
 * Pass the list of message media references; returns a `{ key -> signedUrl }`
 * map. Keys re-resolve when a new bare key appears (caching handles repeats).
 */
export function useSignedChatMedia(
  mediaRefs: ReadonlyArray<string | null | undefined>,
): Record<string, string> {
  const [signed, setSigned] = useState<Record<string, string>>({});

  // Stable, deduped signature of the keys that still need resolving.
  const pendingKeys = [...new Set(mediaRefs.filter(isBareMediaKey))]
    .filter(key => !signed[key])
    .sort();
  const signature = pendingKeys.join('|');

  useEffect(() => {
    if (!signature) {
      return;
    }
    let cancelled = false;
    void signMediaReadUrls(signature.split('|')).then(map => {
      if (!cancelled && Object.keys(map).length > 0) {
        setSigned(prev => ({ ...prev, ...map }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return signed;
}
