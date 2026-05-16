import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppColors } from '@theme/colors';

/** Presence states surfaced in the UI. */
export enum StatusType {
  Online = 'online',
  Offline = 'offline',
  Available = 'available',
}

export type StatusDotProps = {
  status: StatusType;
  size?: number;
  ringWidth?: number;
};

const STATUS_COLOR: Record<StatusType, string> = {
  [StatusType.Online]: AppColors.onlineGreen,
  [StatusType.Offline]: AppColors.offlineGray,
  [StatusType.Available]: AppColors.availableYellow,
};

/** Small colored dot rendered with a white ring so it reads well on photos. */
function StatusDot({ status, size = 10, ringWidth = 1.5 }: StatusDotProps): React.ReactElement {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          backgroundColor: STATUS_COLOR[status],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderColor: AppColors.surface },
});

export default StatusDot;
