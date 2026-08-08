import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, RotateCcw, SwitchCamera, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
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
import { Env } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import { VerificationStatus } from '@app-types/domain';

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
  const setVerificationStatus = useSessionStore(s => s.setVerificationStatus);

  const [side, setSide] = useState<CameraSide>('front');
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  /**
   * Latches once the photo has been accepted by the backend. Capture and
   * submit stay disabled from that point until Retake clears it, so a slow
   * navigation transition or a stray double-tap cannot upload twice.
   */
  const [submitted, setSubmitted] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [appActive, setAppActive] = useState<boolean>(true);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  // Capture is locked while previewing, uploading, or after a successful
  // submit — the three states where another shot must not be taken.
  const captureLocked = previewPath !== null || uploading || submitted;

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
    if (captureLocked) {
      return;
    }
    // The simulated photo exists only for environments with no real camera
    // (e.g. the iOS Simulator). It is gated strictly on the explicit DEV_MODE
    // flag — NOT __DEV__ — so a normal debug build always uses the real camera
    // and takes an actual photo rather than silently substituting a stock image.
    if (Env.devMode && !cameraRef.current) {
      setCaptureError(null);
      setPreviewPath(
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
      );
      return;
    }
    if (!cameraRef.current) {
      setCaptureError('Camera not ready yet, try again');
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
  }, [captureLocked]);

  /** The "Retry" path — the only way back to a live camera after a submit. */
  const handleRetake = useCallback((): void => {
    setPreviewPath(null);
    setCaptureError(null);
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    // Re-entrancy guard: without it a double-tap fires two uploads, and the
    // second lands after the screen has already been reset.
    if (!previewPath || uploading || submitted) {
      return;
    }
    setUploading(true);
    try {
      const remotePath = await submitVerificationPhoto(previewPath);
      setSubmitted(true);
      setVerificationPhoto(remotePath);
      // Reflect the submission locally so routing is deterministic even if the
      // `females` realtime UPDATE (which also flips this to pending) is delayed
      // or dropped. Keeps her gated to the pending screen, not bounced out.
      setVerificationStatus(VerificationStatus.Pending);
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
  }, [navigation, previewPath, setVerificationPhoto, setVerificationStatus, submitted, uploading]);

  const handleFlip = useCallback((): void => {
    setSide(prev => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const handleClose = useCallback((): void => {
    setCancelDialog(true);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {previewPath ? (
        <Image source={{ uri: previewPath }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          // Shut the sensor down while previewing or after submitting — it is
          // the single most expensive thing on this screen, and leaving it
          // streaming behind a still image burns battery and memory for
          // nothing.
          isActive={appActive && !captureLocked}
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
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <X size={24} color={AppColors.surface} strokeWidth={2.4} />
          </Pressable>
          {canFlip && !captureLocked ? (
            <Pressable
              onPress={handleFlip}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <SwitchCamera size={24} color={AppColors.surface} strokeWidth={2.2} />
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
              {/* Standard platform shutter: white ring with an inset solid
                  disc, matching the stock Android/iOS camera control. */}
              <Pressable
                onPress={handleCapture}
                disabled={captureLocked}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                accessibilityState={{ disabled: captureLocked }}
                style={({ pressed }) => [
                  styles.shutterRing,
                  pressed && styles.shutterPressed,
                  captureLocked && styles.controlDisabled,
                ]}
              >
                <View style={styles.shutterCore} />
              </Pressable>
            </>
          ) : (
            <View style={styles.previewActions}>
              <View style={styles.actionSlot}>
                <Pressable
                  onPress={handleRetake}
                  disabled={uploading}
                  accessibilityRole="button"
                  accessibilityLabel="Retake photo"
                  accessibilityState={{ disabled: uploading }}
                  style={({ pressed }) => [
                    styles.roundAction,
                    styles.roundActionCancel,
                    pressed && styles.roundActionPressed,
                    uploading && styles.controlDisabled,
                  ]}
                >
                  <RotateCcw size={30} color={AppColors.surface} strokeWidth={2.2} />
                </Pressable>
                <Text style={styles.actionLabel}>Retake</Text>
              </View>
              <View style={styles.actionSlot}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={uploading || submitted}
                  accessibilityRole="button"
                  accessibilityLabel="Submit photo"
                  accessibilityState={{ disabled: uploading || submitted }}
                  style={({ pressed }) => [
                    styles.roundAction,
                    styles.roundActionConfirm,
                    pressed && styles.roundActionPressed,
                    (uploading || submitted) && styles.controlDisabled,
                  ]}
                >
                  <Check size={34} color={AppColors.surface} strokeWidth={2.6} />
                </Pressable>
                <Text style={styles.actionLabel}>Submit</Text>
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
    paddingTop:
      Platform.OS === 'android' ? AppSpacing.sm + (StatusBar.currentHeight ?? 0) : AppSpacing.sm,
  },
  // 44pt is the platform minimum touch target; the old 36pt glyph buttons
  // were below it and had no contrast against a bright camera feed.
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: { opacity: 0.7 },
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
  shutterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: AppColors.surface,
  },
  shutterPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  shutterCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: AppColors.surface,
  },
  previewActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: AppSpacing.xl * 1.5,
  },
  actionSlot: { alignItems: 'center', gap: AppSpacing.xs },
  // Large circular confirm/cancel pair — the reviewed screen used small
  // full-width text buttons that were easy to mis-tap over a live preview.
  roundAction: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  roundActionCancel: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roundActionConfirm: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.surface,
  },
  roundActionPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  controlDisabled: { opacity: 0.45 },
  actionLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.surface,
  },
});

export default FaceCaptureScreen;
