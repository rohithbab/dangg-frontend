import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import LoadingOverlay from '@core/components/LoadingOverlay';
import { AVATAR_MAX_DIMENSION, imageConstraints } from '@core/config/media';
import { AppException } from '@core/network/apiException';
import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { logger } from '@core/utils/logger';

import { removeAvatar, updateAvatar } from '../api/profileApi';

export type EditProfilePicSheetProps = {
  visible: boolean;
  hasExistingPhoto: boolean;
  onClose: () => void;
  /** Called with the new public URL (or null when the avatar is removed). */
  onAvatarChanged: (publicUrl: string | null) => void;
};

function CameraIcon(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function GalleryIcon(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function DeleteIcon(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill={AppColors.error}
      />
    </Svg>
  );
}

/**
 * Bottom sheet for changing the profile picture: Take Photo / Choose from
 * Gallery / Remove. Camera and gallery flows funnel through
 * `permissionService` then `react-native-image-picker`. Upload is handled
 * by `profileApi.updateAvatar` (DEV_MODE stubs the upload).
 */
function EditProfilePicSheet({
  visible,
  hasExistingPhoto,
  onClose,
  onAvatarChanged,
}: EditProfilePicSheetProps): React.ReactElement {
  const [uploading, setUploading] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(false);

  const uploadFrom = useCallback(
    async (localPath: string): Promise<void> => {
      setUploading(true);
      try {
        const url = await updateAvatar(localPath);
        onAvatarChanged(url);
        onClose();
      } catch (e) {
        if (e instanceof AppException) {
          logger.warn('updateAvatar failed', e.message);
        } else {
          logger.error('updateAvatar failed', e);
        }
      } finally {
        setUploading(false);
      }
    },
    [onAvatarChanged, onClose],
  );

  const handleTakePhoto = useCallback(async (): Promise<void> => {
    const perm = await permissionService.requestCamera();
    if (perm !== AppPermissionStatus.Granted) {
      return;
    }
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      ...imageConstraints(AVATAR_MAX_DIMENSION),
      saveToPhotos: false,
    });
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      await uploadFrom(uri);
    }
  }, [uploadFrom]);

  const handlePickGallery = useCallback(async (): Promise<void> => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      ...imageConstraints(AVATAR_MAX_DIMENSION),
      selectionLimit: 1,
    });
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      await uploadFrom(uri);
    }
  }, [uploadFrom]);

  const handleRemove = useCallback(async (): Promise<void> => {
    setRemoveDialog(false);
    setUploading(true);
    try {
      await removeAvatar();
      onAvatarChanged(null);
      onClose();
    } catch (e) {
      if (e instanceof AppException) {
        logger.warn('removeAvatar failed', e.message);
      } else {
        logger.error('removeAvatar failed', e);
      }
    } finally {
      setUploading(false);
    }
  }, [onAvatarChanged, onClose]);

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} title="Update profile picture">
        <Text style={styles.subtitle}>Choose how to update</Text>
        <View style={styles.options}>
          <SheetRow
            icon={<CameraIcon />}
            label="Take Photo with Camera"
            onPress={() => {
              void handleTakePhoto();
            }}
          />
          <SheetRow
            icon={<GalleryIcon />}
            label="Choose from Gallery"
            onPress={() => {
              void handlePickGallery();
            }}
          />
          {hasExistingPhoto ? (
            <SheetRow
              icon={<DeleteIcon />}
              label="Remove Current Photo"
              destructive
              onPress={() => setRemoveDialog(true)}
            />
          ) : null}
        </View>
      </BottomSheet>

      <ConfirmationDialog
        visible={removeDialog}
        title="Remove profile picture?"
        body="Your default avatar will be shown instead."
        confirmLabel="Remove"
        cancelLabel="Keep"
        destructive
        onCancel={() => setRemoveDialog(false)}
        onConfirm={() => {
          void handleRemove();
        }}
      />

      <LoadingOverlay visible={uploading} message="Updating profile picture…" />
    </>
  );
}

type SheetRowProps = {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

function SheetRow({
  icon,
  label,
  destructive = false,
  onPress,
}: SheetRowProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: AppSpacing.md,
  },
  options: { gap: AppSpacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: AppSpacing.md,
    gap: AppSpacing.md,
  },
  rowPressed: { backgroundColor: AppColors.primarySubtle },
  rowIcon: { width: 32, alignItems: 'center' },
  rowLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  rowLabelDestructive: { color: AppColors.error },
});

export default EditProfilePicSheet;
