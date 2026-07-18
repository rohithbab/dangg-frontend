import React from 'react';

import ConfirmationDialog from '@core/components/ConfirmationDialog';

import { useDeviceKickStore } from '@store/deviceKickStore';

/**
 * Global notice for single-device login (see sessionStore's device-session
 * guard). By the time `kicked` flips true the session is already cleared —
 * this only tells the user why they landed back on the login screen.
 */
function DeviceKickedNotice(): React.ReactElement {
  const kicked = useDeviceKickStore(s => s.kicked);
  const setKicked = useDeviceKickStore(s => s.setKicked);

  return (
    <ConfirmationDialog
      visible={kicked}
      title="Logged out"
      body="You signed in on another device, so this device has been logged out."
      confirmLabel="OK"
      hideCancel
      onConfirm={() => setKicked(false)}
      onCancel={() => setKicked(false)}
    />
  );
}

export default DeviceKickedNotice;
