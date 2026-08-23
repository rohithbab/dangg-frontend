import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { PrefsKey, prefsStorage } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

/** Both app stacks register a `NotificationPermission` route with no params. */
type PrimerNav = NativeStackNavigationProp<{ NotificationPermission: undefined }>;

/**
 * Asks a newly-installed user for notification permission exactly once.
 *
 * On the first time the user lands in the app (home mount), if we've never
 * primed before AND the OS permission isn't already granted, we show the
 * in-app primer (which then triggers the native POST_NOTIFICATIONS dialog on
 * Android 13+ / the iOS prompt, and routes to Settings if it's blocked). The
 * one-time flag is set immediately so it never appears again — no nagging on
 * later launches. Users who already granted (e.g. Android < 13, where
 * notifications are on by default) are silently marked primed.
 */
export function useNotificationPrimer(): void {
  const navigation = useNavigation<PrimerNav>();

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (prefsStorage.getBool(PrefsKey.NotifPermissionPrimed)) {
        return;
      }
      try {
        const status = await permissionService.checkNotifications();
        if (cancelled) {
          return;
        }
        // Mark primed up-front: this is a one-shot for the install, whatever
        // the user decides on the primer.
        prefsStorage.setBool(PrefsKey.NotifPermissionPrimed, true);
        if (status !== AppPermissionStatus.Granted) {
          navigation.navigate('NotificationPermission');
        }
      } catch (e) {
        logger.warn('useNotificationPrimer check failed', e);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigation]);
}
