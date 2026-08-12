import React, { useCallback } from 'react';

import AppAlert from '@core/components/AppAlert';
import Toast from '@core/components/Toast';

import { useCurrentAlert, useFeedbackStore, useToastMessage } from './feedbackStore';

/**
 * Renders whatever `showAlert` / `showToast` have queued.
 *
 * Mounted once, at the app root inside the navigation container, so alerts sit
 * above every screen — the property that made `Alert.alert` convenient in the
 * first place, minus the platform chrome.
 */
function FeedbackHost(): React.ReactElement {
  const alert = useCurrentAlert();
  const toast = useToastMessage();
  const dismissAlert = useFeedbackStore(s => s.dismissAlert);
  const setToast = useFeedbackStore(s => s.setToast);

  const handleToastHidden = useCallback((): void => setToast(null), [setToast]);

  return (
    <>
      <AppAlert
        // Keyed on the queue head so a second alert re-runs the entrance
        // animation instead of swapping text inside an already-open modal.
        key={alert ? `${alert.title}-${alert.message ?? ''}` : 'none'}
        visible={alert !== null}
        title={alert?.title ?? ''}
        message={alert?.message}
        buttons={alert?.buttons}
        onDismiss={dismissAlert}
      />
      <Toast message={toast} onHide={handleToastHidden} />
    </>
  );
}

export default FeedbackHost;
