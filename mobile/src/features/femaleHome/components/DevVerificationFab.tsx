import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { Env } from '@core/config/env';
import { logger } from '@core/utils/logger';

import { useSessionStore } from '@store/sessionStore';

import { UserRole, VerificationStatus } from '@app-types/domain';

import {
  fetchDevFemales,
  toggleDevVerification,
  type DevFemaleUser,
} from '../api/devVerificationApi';

const FAB_SIZE = 56;
const MARGIN = 12;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function DevVerificationFab(): React.ReactElement | null {
  const role = useSessionStore(s => s.role);
  const session = useSessionStore(s => s.session);
  const setVerificationStatus = useSessionStore(s => s.setVerificationStatus);

  // Position it on the left side of the screen to avoid overlapping with DevSimulateChatFab
  const x = useSharedValue(MARGIN);
  const y = useSharedValue(SCREEN_HEIGHT - FAB_SIZE - 210);

  const startX = useRef(x.value);
  const startY = useRef(y.value);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  // Modal & Data state
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [females, setFemales] = useState<DevFemaleUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        startX.current = x.value;
        startY.current = y.value;
        movedRef.current = true;
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => {
        x.value = startX.current + g.dx;
        y.value = startY.current + g.dy;
      },
      onPanResponderRelease: () => {
        setDragging(false);
        const settledX = x.value;
        // Snap to left or right margin
        const targetX =
          settledX + FAB_SIZE / 2 < SCREEN_WIDTH / 2 ? MARGIN : SCREEN_WIDTH - FAB_SIZE - MARGIN;
        const clampedY = Math.max(MARGIN, Math.min(SCREEN_HEIGHT - FAB_SIZE - MARGIN, y.value));
        x.value = withSpring(targetX, { damping: 18, stiffness: 220 });
        y.value = withSpring(clampedY, { damping: 18, stiffness: 220 });
        setTimeout(() => {
          movedRef.current = false;
        }, 50);
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        setTimeout(() => {
          movedRef.current = false;
        }, 50);
      },
    }),
  ).current;

  // Load females from DB when modal opens
  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchDevFemales();
      setFemales(data);
    } catch (e) {
      logger.error('Failed to load females in dev verification FAB', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (): void => {
    if (movedRef.current) {
      return;
    }
    setModalVisible(true);
    void loadData();
  };

  const handleToggleVerification = async (femaleId: string): Promise<void> => {
    setActionInProgress(femaleId);
    try {
      const result = await toggleDevVerification(femaleId);

      // Update local list state
      setFemales(prev =>
        prev.map(f =>
          f.id === femaleId
            ? {
                ...f,
                verification_status:
                  result.verification_status as DevFemaleUser['verification_status'],
              }
            : f,
        ),
      );

      // If the toggled female is the currently logged-in user, also sync the local session store immediately
      if (session && session.user.id === femaleId) {
        const newStatus =
          result.verification_status === 'verified'
            ? VerificationStatus.Verified
            : VerificationStatus.None;
        setVerificationStatus(newStatus);
      }
    } catch (e) {
      logger.error('Failed to toggle verification in dev FAB', e);
    } finally {
      setActionInProgress(null);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
  }));

  // Only show in development environment AND for female roles (per request to show on female UI)
  if (Env.appEnv !== 'development' || role !== UserRole.Female) {
    return null;
  }

  const filteredFemales = females.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.phone || '').includes(searchQuery),
  );

  return (
    <>
      <Animated.View
        style={[styles.fab, animatedStyle, dragging && styles.fabDragging]}
        {...panResponder.panHandlers}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle verification dev helper"
          onPress={handleOpenModal}
          style={styles.pressable}
        >
          <Text style={styles.icon}>🛠️</Text>
          <View style={styles.labelBubble}>
            <Text style={styles.labelText}>VERIFY</Text>
          </View>
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dev Verification Console</Text>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={AppColors.onSurfaceMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={styles.loadingText}>Fetching database users...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFemales}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No female users found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isVerified = item.verification_status === 'verified';
                const isUpdating = actionInProgress === item.id;
                const isCurrentSelf = session?.user.id === item.id;

                return (
                  <View style={[styles.userRow, isCurrentSelf && styles.selfUserRow]}>
                    <View style={styles.userInfo}>
                      <View style={styles.nameContainer}>
                        <Text style={styles.userName}>
                          {item.name} {isCurrentSelf && <Text style={styles.selfTag}>(You)</Text>}
                        </Text>
                        <Text
                          style={[
                            styles.statusTag,
                            isVerified ? styles.verifiedTag : styles.unverifiedTag,
                          ]}
                        >
                          {item.verification_status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.userPhone}>{item.phone || 'No phone'}</Text>
                    </View>
                    <View style={styles.toggleContainer}>
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={AppColors.primary} />
                      ) : (
                        <Switch
                          value={isVerified}
                          onValueChange={() => {
                            void handleToggleVerification(item.id);
                          }}
                          trackColor={{ false: '#767577', true: AppColors.onlineGreen }}
                        />
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#374151', // Dark slate gray
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  fabDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24, color: '#fff' },
  labelBubble: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: AppColors.onlineGreen,
    borderRadius: AppRadii.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  labelText: {
    ...AppTypography.labelSmall,
    color: '#fff',
    fontWeight: '800',
    fontSize: 8,
    letterSpacing: 0.4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  closeButton: {
    paddingVertical: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadii.md,
    backgroundColor: AppColors.error,
  },
  closeButtonText: {
    ...AppTypography.labelLarge,
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    margin: AppSpacing.lg,
    padding: AppSpacing.md,
    borderRadius: AppRadii.md,
    backgroundColor: AppColors.surface,
    color: AppColors.primaryDark,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppTypography.bodyMedium,
  },
  listContainer: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xxl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadii.md,
    backgroundColor: AppColors.surface,
    marginBottom: AppSpacing.sm,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  selfUserRow: {
    borderColor: AppColors.primary,
    borderWidth: 1.5,
    backgroundColor: '#fffbeb', // Subtle gold/cream tint for self
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
  },
  userName: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  selfTag: {
    ...AppTypography.labelSmall,
    color: AppColors.primary,
    fontWeight: '800',
  },
  statusTag: {
    ...AppTypography.labelSmall,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  verifiedTag: {
    backgroundColor: '#dcfce7',
    color: AppColors.onlineGreen,
  },
  unverifiedTag: {
    backgroundColor: '#f3f4f6',
    color: AppColors.onSurfaceMuted,
  },
  userPhone: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  toggleContainer: {
    marginLeft: AppSpacing.md,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppSpacing.xl,
  },
  loadingText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.md,
  },
  emptyText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
});

export default DevVerificationFab;
