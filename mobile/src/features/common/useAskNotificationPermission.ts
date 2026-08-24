import { useEffect, useRef } from 'react';

import { showAlert } from '@core/feedback';
import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { PrefsKey, prefsStorage } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

/**
 * Asks a newly-installed user for notification permission exactly once — via
 * the native OS dialog directly, with no in-app primer screen.
 *
 * On the first time the user lands in the app (home mount), if we've never
 * asked before, we trigger the platform permission request (Android 13+
 * POST_NOTIFICATIONS / the iOS prompt). If it comes back blocked, we offer a
 * jump to Settings. The one-time flag is set up-front so it never appears
 * again — no nagging on later launches. Already-granted (e.g. Android < 13,
 * where notifications are on by default) is a silent no-op.
 */
export function useAskNotificationPermission(): void {
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) {
      return;
    }
    asked.current = true;
    void (async () => {
      try {
        if (prefsStorage.getBool(PrefsKey.NotifPermissionPrimed)) {
          return;
        }
        // One-shot for this install, whatever the user decides.
        prefsStorage.setBool(PrefsKey.NotifPermissionPrimed, true);
        const result = await permissionService.requestNotifications();
        if (result === AppPermissionStatus.PermanentlyDenied) {
          showAlert({
            title: 'Turn on notifications',
            message: 'Notifications are turned off for Dangg. Open Settings to turn them on.',
            buttons: [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  void permissionService.openAppSettings();
                },
              },
            ],
          });
        }
      } catch (e) {
        logger.warn('useAskNotificationPermission failed', e);
      }
    })();
  }, []);
}
