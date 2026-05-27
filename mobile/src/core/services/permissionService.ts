import { Platform } from 'react-native';
import {
  check,
  checkNotifications,
  openSettings,
  PERMISSIONS,
  request,
  requestNotifications,
  RESULTS,
  type Permission,
  type PermissionStatus as RNPermissionStatus,
} from 'react-native-permissions';

import { Env } from '../config/env';

/** Outcome of a permission request — collapses platform variations into three states. */
export enum AppPermissionStatus {
  Granted = 'granted',
  Denied = 'denied',
  PermanentlyDenied = 'permanently_denied',
}

function cameraPermission(): Permission {
  return Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
}

function galleryPermission(): Permission {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }
  return Number(Platform.Version) >= 33
    ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
}

function toAppStatus(status: RNPermissionStatus): AppPermissionStatus {
  switch (status) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return AppPermissionStatus.Granted;
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
      return AppPermissionStatus.PermanentlyDenied;
    case RESULTS.DENIED:
    default:
      return AppPermissionStatus.Denied;
  }
}

/**
 * Permission helpers. Callers should never depend on `react-native-permissions`
 * directly — go through this module for portability.
 */
export const permissionService = {
  async requestCamera(): Promise<AppPermissionStatus> {
    if (Env.devMode) {
      return AppPermissionStatus.Granted;
    }
    return toAppStatus(await request(cameraPermission()));
  },

  async requestGallery(): Promise<AppPermissionStatus> {
    if (Env.devMode) {
      return AppPermissionStatus.Granted;
    }
    return toAppStatus(await request(galleryPermission()));
  },

  /**
   * Notifications use a separate API in `react-native-permissions` because
   * iOS exposes a richer settings object than the generic permission
   * surface. The `alert`/`sound`/`badge` options match the splash defaults.
   */
  async requestNotifications(): Promise<AppPermissionStatus> {
    if (Env.devMode) {
      return AppPermissionStatus.Granted;
    }
    const { status } = await requestNotifications(['alert', 'sound', 'badge']);
    return toAppStatus(status);
  },

  async checkNotifications(): Promise<AppPermissionStatus> {
    if (Env.devMode) {
      return AppPermissionStatus.Granted;
    }
    const { status } = await checkNotifications();
    return toAppStatus(status);
  },

  async checkCamera(): Promise<AppPermissionStatus> {
    if (Env.devMode) {
      return AppPermissionStatus.Granted;
    }
    return toAppStatus(await check(cameraPermission()));
  },

  /** Opens the system Settings app — call when permission is permanently denied. */
  async openAppSettings(): Promise<void> {
    if (Env.devMode) {
      return;
    }
    await openSettings();
  },
};
