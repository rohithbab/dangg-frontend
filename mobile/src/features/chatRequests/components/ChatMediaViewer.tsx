import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Full-screen in-app viewer for a chat image (WhatsApp-style) instead of
 * kicking the user out to the browser. Tap anywhere or the ✕ to close.
 * Video is opened externally by the caller (no in-app player dependency yet).
 */
export type ChatMediaViewerProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

function ChatMediaViewer({ visible, uri, onClose }: ChatMediaViewerProps): React.ReactElement {
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
            accessibilityLabel="Close image"
          >
            <X size={26} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </SafeAreaView>
        <Pressable style={styles.body} onPress={onClose}>
          {uri ? (
            <FastImage
              source={{ uri }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.contain}
            />
          ) : null}
        </Pressable>
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
  image: { width: '100%', height: '100%' },
});

export default ChatMediaViewer;
