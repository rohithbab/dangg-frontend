import { type RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';

import AppBar from '@core/components/AppBar';

import PolicyMarkdown from '../components/PolicyMarkdown';
import { getPolicy, type PolicyId } from '../content/policies.generated';

/** Route param shape shared by the Auth, Male and Female stacks. */
type PolicyViewerParams = { PolicyViewer: { policyId: PolicyId } };

/**
 * Full-screen reader for a single bundled legal document. Reachable from the
 * signup consent screen and from Profile → About. Content is bundled (offline),
 * rendered with the in-house Markdown renderer.
 */
function PolicyViewerScreen(): React.ReactElement {
  const route = useRoute<RouteProp<PolicyViewerParams, 'PolicyViewer'>>();
  const policy = getPolicy(route.params.policyId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title={policy.title} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator
        overScrollMode="always"
      >
        <PolicyMarkdown markdown={policy.markdown} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.xxl,
  },
});

export default PolicyViewerScreen;
