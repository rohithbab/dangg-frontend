import React, { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import { SUPPORT_EMAIL } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import Accordion from '../components/Accordion';

const SUPPORT_PHONE = '+91 80123 45678';
const SUPPORT_WHATSAPP = 'https://wa.me/918012345678';

const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'How do I get verified?',
    a: 'Upload a clear selfie during signup. Our team reviews submissions within 2 days and notifies you once approved.',
  },
  {
    q: 'When will I receive my earnings?',
    a: 'Earnings are settled to your wallet immediately after each chat. Withdrawals (payouts) are processed within 2–3 business days.',
  },
  {
    q: 'How do payouts work?',
    a: 'Tap Request Payout on the Earnings screen. The minimum payout is ₹100 and only one payout can be in review at a time.',
  },
  {
    q: 'How do I report a user?',
    a: 'Open the incoming chat request popup or chat screen → tap the menu → choose Report. We review every report within 24 hours.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes — from Profile → Delete Account. Pending payouts must clear before deletion. This action is permanent.',
  },
  {
    q: 'Is my data secure?',
    a: 'Verification photos are stored privately in India (Supabase Mumbai). We comply with India’s DPDP Act.',
  },
];

function MailIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function PhoneIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function WhatsAppIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.05 20.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 1 1 15.27-4.39 8.18 8.18 0 0 1-8.28 8.25z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

/** Help & Support — contact card + FAQ accordion list. */
function HelpSupportScreen(): React.ReactElement {
  const handleOpen = useCallback((url: string): void => {
    Linking.openURL(url).catch(e => logger.warn('Failed to open link', url, e));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Help & Support" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.contactCard, AppShadows.e1]}>
          <Text style={styles.contactTitle}>Need to reach us?</Text>
          <ContactRow
            icon={<MailIcon />}
            label={SUPPORT_EMAIL}
            onPress={() => handleOpen(`mailto:${SUPPORT_EMAIL}`)}
          />
          <ContactRow
            icon={<PhoneIcon />}
            label={SUPPORT_PHONE}
            onPress={() => handleOpen(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}
          />
          <ContactRow
            icon={<WhatsAppIcon />}
            label="Chat on WhatsApp"
            onPress={() => handleOpen(SUPPORT_WHATSAPP)}
          />
        </View>

        <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map(faq => (
          <Accordion key={faq.q} question={faq.q} answer={faq.a} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

type ContactRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

function ContactRow({ icon, label, onPress }: ContactRowProps): React.ReactElement {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.contactRow}>
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl },
  contactCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
  },
  contactTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginBottom: AppSpacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.sm,
  },
  contactIcon: { width: 28, alignItems: 'center' },
  contactLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  faqSectionTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
});

export default HelpSupportScreen;
