import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StatusBar, StyleSheet, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';

import { logger } from '@core/utils/logger';

/**
 * True only when the react-native-video native view is actually compiled into
 * the running binary. It is absent until the APK is rebuilt after adding the
 * dependency — rendering <Video> without it red-screens ("bubblingEventTypes
 * of null"). Callers check this and fall back to an external player instead.
 */
export const isVideoPlayerAvailable: boolean = (() => {
  try {
    return UIManager.getViewManagerConfig?.('RCTVideo') != null;
  } catch {
    return false;
  }
})();

/**
 * Full-screen in-app video player for a chat video — the counterpart to
 * ChatMediaViewer (images). Native controls (play/pause/seek/fullscreen); tap
 * the ✕ to close. Replaces the previous Linking.openURL hand-off to an external
 * player.
 *
 * The <Video> is mounted only while visible, so closing unmounts the player and
 * stops playback/audio instead of leaving it running in the background.
 */
export type ChatVideoViewerProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

function ChatVideoViewer({ visible, uri, onClose }: ChatVideoViewerProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.header} edges={['top']}>
          <Pressable
            onPress={onClose}
            hitSlop={16}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close video"
          >
            <X size={26} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.body}>
          {visible && uri && isVideoPlayerAvailable ? (
            <Video
              source={{ uri }}
              style={styles.video}
              controls
              resizeMode="contain"
              paused={false}
              onError={e => logger.warn('ChatVideoViewer playback error', e)}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
});

export default ChatVideoViewer;
