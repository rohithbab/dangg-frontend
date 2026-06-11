import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Tap on the dimmed backdrop closes the sheet (default true). */
  dismissOnOutsideTap?: boolean;
};

/**
 * Premium bottom sheet — custom Reanimated transitions for backdrop fade
 * and panel slide, with managed entry/exit lifecycles to prevent native modal cut-offs.
 */
function BottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissOnOutsideTap = true,
}: BottomSheetProps): React.ReactElement {
  const [modalVisible, setModalVisible] = useState(false);
  const scrimOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      scrimOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      sheetTranslateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      scrimOpacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) });
      sheetTranslateY.value = withTiming(
        SCREEN_HEIGHT,
        {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        },
        finished => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        },
      );
    }
  }, [visible, scrimOpacity, sheetTranslateY]);

  const handleDismiss = (): void => {
    if (dismissOnOutsideTap) {
      onClose();
    }
  };

  const animatedScrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <Modal transparent visible={modalVisible} statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Animated backdrop (scrim) */}
        <Animated.View style={[styles.scrimContainer, animatedScrimStyle]}>
          <Pressable style={styles.scrimPressable} onPress={handleDismiss} />
        </Animated.View>

        {/* Animated sheet panel */}
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrimContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.scrim,
  },
  scrimPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: AppSpacing.sm,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.divider,
    alignSelf: 'center',
    marginBottom: AppSpacing.sm,
  },
  title: {
    ...AppTypography.titleMedium,
    paddingHorizontal: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  content: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
  },
});

export default BottomSheet;
