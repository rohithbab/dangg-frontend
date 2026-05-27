import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import LoadingOverlay from '@core/components/LoadingOverlay';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { Env } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { submitVerificationPhoto } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupFaceCapture'>;
type CameraSide = 'front' | 'back';

/**
 * Full-screen camera capture for the verification selfie. Front-facing by
 * default, flippable if the device has both cameras. The captured photo is
 * uploaded via `submitVerificationPhoto` (DEV_MODE simulates the upload)
 * and the screen advances to the Submitted confirmation.
 */
function FaceCaptureScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setVerificationPhoto = useSignupDraftStore(s => s.setVerificationPhoto);

  const [side, setSide] = useState<CameraSide>('front');
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [appActive, setAppActive] = useState<boolean>(true);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = side === 'front' ? frontDevice : backDevice;
  const canFlip = frontDevice !== undefined && backDevice !== undefined;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      setAppActive(s === 'active');
    });
    return () => sub.remove();
  }, []);

  const handleCapture = useCallback(async (): Promise<void> => {
    if (Env.devMode && !cameraRef.current) {
      setCaptureError(null);
      setPreviewPath(
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
      );
      return;
    }
    if (!cameraRef.current) {
      return;
    }
    try {
      setCaptureError(null);
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      setPreviewPath(`file://${photo.path}`);
    } catch (e) {
      logger.error('FaceCaptureScreen.capture failed', e);
      setCaptureError('Could not take the photo, try again');
    }
  }, []);

  const handleRetake = useCallback((): void => {
    setPreviewPath(null);
    setCaptureError(null);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!previewPath) {
      return;
    }
    setUploading(true);
    try {
      const remotePath = await submitVerificationPhoto(previewPath);
      setVerificationPhoto(remotePath);
      navigation.reset({
        index: 0,
        routes: [{ name: 'FemaleSignupVerificationSubmitted' }],
      });
    } catch (e) {
      setUploading(false);
      if (e instanceof AppException) {
        setCaptureError(e.message);
      } else {
        logger.error('FaceCaptureScreen.submit failed', e);
        setCaptureError('Upload failed, try again');
      }
    }
  }, [navigation, previewPath, setVerificationPhoto]);

  const handleFlip = useCallback((): void => {
    setSide(prev => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const handleClose = useCallback((): void => {
    setCancelDialog(true);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="black" translucent={false} />
      {previewPath ? (
        <Image source={{ uri: previewPath }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={appActive}
          photo
        />
      ) : (
        <View style={styles.cameraFallback}>
          <Text style={styles.fallbackText}>Camera unavailable on this device</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.iconButton}
          >
            <Text style={styles.iconGlyph}>{'×'}</Text>
          </Pressable>
          {canFlip ? (
            <Pressable
              onPress={handleFlip}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
              style={styles.iconButton}
            >
              <Text style={styles.iconGlyph}>{'⤺'}</Text>
            </Pressable>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {!previewPath ? (
          <View style={styles.center} pointerEvents="none">
            <View style={styles.oval} />
          </View>
        ) : (
          <View style={styles.center} pointerEvents="none" />
        )}

        <View style={styles.bottom}>
          {captureError ? <Text style={styles.errorText}>{captureError}</Text> : null}
          {!previewPath ? (
            <>
              <Text style={styles.hint}>Position your face in the oval</Text>
              <Pressable
                onPress={handleCapture}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </>
          ) : (
            <View style={styles.previewActions}>
              <View style={styles.actionHalf}>
                <SecondaryButton label="Retake" onPress={handleRetake} />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton label="Submit" onPress={handleSubmit} />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      <LoadingOverlay visible={uploading} message="Uploading…" />
      <ConfirmationDialog
        visible={cancelDialog}
        title="Cancel verification?"
        body="Your progress will be saved — you can come back later."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep going"
        destructive
        onCancel={() => setCancelDialog(false)}
        onConfirm={() => {
          setCancelDialog(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const OVAL_WIDTH = 240;
const OVAL_HEIGHT = 320;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black' },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  fallbackText: {
    ...AppTypography.bodyLarge,
    color: AppColors.surface,
  },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: AppColors.primaryDark,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: AppSpacing.xl,
    paddingHorizontal: AppSpacing.lg,
  },
  errorText: {
    ...AppTypography.bodyMedium,
    color: AppColors.surface,
    backgroundColor: AppColors.error,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
    borderRadius: AppRadii.sm,
    marginBottom: AppSpacing.sm,
  },
  hint: {
    ...AppTypography.bodyMedium,
    color: AppColors.surface,
    textAlign: 'center',
    marginBottom: AppSpacing.md,
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: AppColors.primary,
  },
  shutterPressed: { opacity: 0.85 },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.surface,
  },
  previewActions: {
    flexDirection: 'row',
    width: '100%',
    gap: AppSpacing.md,
  },
  actionHalf: { flex: 1 },
});

export default FaceCaptureScreen;
