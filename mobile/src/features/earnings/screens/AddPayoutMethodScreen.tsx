import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight, IndianRupee, Landmark, Lock } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import { type FemaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'AddPayoutMethod'>;

/** F2 · Add a method — choose UPI or bank, then go to the matching form. */
function AddPayoutMethodScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

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

      <View style={styles.body}>
        <Text style={styles.title}>Add a method</Text>

        <View style={styles.options}>
          <OptionCard
            icon={<IndianRupee size={20} color={AppColors.onSurface} strokeWidth={2} />}
            title="UPI"
            subtitle="Instant, free"
            onPress={() => navigation.navigate('AddUpi')}
          />
          <OptionCard
            icon={<Landmark size={20} color={AppColors.onSurface} strokeWidth={1.8} />}
            title="Bank account"
            subtitle="1–2 business days"
            onPress={() => navigation.navigate('AddBank')}
          />
        </View>

        <View style={styles.secureRow}>
          <Lock size={13} color={AppColors.onSurfaceMuted} strokeWidth={2} />
          <Text style={styles.secureText}>Your details are encrypted.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={AppColors.onSurfaceMuted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  options: { gap: 12, marginTop: AppSpacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  pressed: { opacity: 0.85 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontFamily: InterFont.medium, fontSize: 16, color: AppColors.onSurface },
  cardSub: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: AppSpacing.lg,
  },
  secureText: { fontFamily: InterFont.regular, fontSize: 12.5, color: AppColors.onSurfaceMuted },
});

export default AddPayoutMethodScreen;
