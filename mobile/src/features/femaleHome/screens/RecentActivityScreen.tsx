import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import EmptyState from '@core/components/EmptyState';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { type RecentActivity, getRecentActivity } from '../api/femaleHomeApi';
import RecentActivityItem from '../components/RecentActivityItem';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'RecentActivity'>;

const ACTIVITY_PAGE_SIZE = 50;

/** Full Recent Activity feed — the "See all" destination from the home card. */
function RecentActivityScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [activity, setActivity] = useState<ReadonlyArray<RecentActivity>>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getRecentActivity(ACTIVITY_PAGE_SIZE)
        .then(setActivity)
        .catch(e => logger.error('RecentActivityScreen.load failed', e))
        .finally(() => setLoaded(true));
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Recent activity</Text>

        {loaded && activity.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No activity yet"
              body="Completed chats and payouts will show up here."
            />
          </View>
        ) : (
          <View style={styles.card}>
            {activity.map((item, idx) => (
              <View key={item.id} style={idx > 0 ? styles.rowDivider : undefined}>
                <RecentActivityItem item={item} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  scroll: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.xl },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  emptyWrap: { marginTop: 48 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 4,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
});

export default RecentActivityScreen;
