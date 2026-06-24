import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, Check, ChevronLeft, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { completeSignupProfile, markOnboardingSeen } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignupProfile'>;

const MIN_AGE = 18;
const MAX_AGE = 100;

type RoleCardProps = {
  glyph: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

function RoleCard({
  glyph,
  title,
  subtitle,
  selected,
  onPress,
}: RoleCardProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.roleCard, selected && styles.roleCardSelected]}
    >
      {selected ? (
        <View style={styles.roleCheck}>
          <Check size={12} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : null}
      <Text style={styles.roleGlyph}>{glyph}</Text>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

/**
 * Signup step 3 — profile (Neue "Set up your profile"). Collects display name,
 * age and role (Man/Woman) after the phone is verified, then finalises the
 * account via completeSignupProfile and routes by role.
 */
function SignupProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ageNum = Number.parseInt(age, 10);
  const ageOk = Number.isFinite(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE;
  const canCreate = name.trim().length > 0 && ageOk && role !== null && !submitting;

  const handleCreate = useCallback(async (): Promise<void> => {
    if (!role) {
      return;
    }
    if (!ageOk) {
      setError(`Age must be between ${MIN_AGE} and ${MAX_AGE}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeSignupProfile({ name: name.trim(), age: ageNum, role });
      markOnboardingSeen();
      const isFemale = role === UserRole.Female;
      useSignupDraftStore.getState().clear();
      if (isFemale) {
        // Female continues into the verification flow; RootNavigator keeps her
        // in the auth stack until verified.
        navigation.reset({ index: 0, routes: [{ name: 'FemaleSignupBankUpi' }] });
      }
      // Male: RootNavigator switches to the male tabs as the session lands.
    } catch (e) {
      if (e instanceof AppException) {
        setError(e.message);
      } else {
        logger.error('SignupProfileScreen.create failed', e);
        setError('Could not create profile, try again');
      }
      setSubmitting(false);
    }
  }, [ageNum, ageOk, name, navigation, role]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft size={26} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Set up{'\n'}your profile</Text>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <User size={34} color="#8C8C94" strokeWidth={1.6} />
            </View>
            <View style={styles.cameraBadge}>
              <Camera size={14} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.nameField}>
              <Text style={styles.label}>DISPLAY NAME</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Aisha"
                  placeholderTextColor="#5A5A62"
                  autoCapitalize="words"
                  maxLength={30}
                />
              </View>
            </View>
            <View style={styles.ageField}>
              <Text style={styles.label}>AGE</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={t => {
                    setAge(t.replace(/\D/g, '').slice(0, 3));
                    if (error) {
                      setError(null);
                    }
                  }}
                  placeholder="24"
                  placeholderTextColor="#5A5A62"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          <Text style={[styles.label, styles.joiningLabel]}>I'M JOINING AS</Text>
          <View style={styles.rolesRow}>
            <RoleCard
              glyph="♂"
              title="Man"
              subtitle="Meet & chat"
              selected={role === UserRole.Male}
              onPress={() => setRole(UserRole.Male)}
            />
            <RoleCard
              glyph="♀"
              title="Woman"
              subtitle="Chat & earn"
              selected={role === UserRole.Female}
              onPress={() => setRole(UserRole.Female)}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Create profile"
            variant="white"
            loading={submitting}
            disabled={!canCreate}
            onPress={() => {
              void handleCreate();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 16,
  },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.lg,
  },
  title: {
    fontFamily: InterFont.light,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: -0.825,
    color: AppColors.onSurface,
  },
  avatarWrap: { alignSelf: 'center', marginTop: AppSpacing.xl, marginBottom: AppSpacing.lg },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.primary,
    borderWidth: 2,
    borderColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldsRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  ageField: { width: 92 },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#6B6B73',
    marginBottom: AppSpacing.sm,
  },
  field: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0E0E10',
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: { fontFamily: InterFont.medium, fontSize: 16, color: AppColors.onSurface, padding: 0 },
  joiningLabel: { marginTop: AppSpacing.lg },
  rolesRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    height: 96,
    borderRadius: 18,
    backgroundColor: '#1A1A1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(220,48,143,0.12)',
  },
  roleCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleGlyph: { fontFamily: InterFont.regular, fontSize: 24, color: AppColors.onSurface },
  roleTitle: {
    fontFamily: InterFont.medium,
    fontSize: 16,
    color: AppColors.onSurface,
    marginTop: 6,
  },
  roleSubtitle: { fontFamily: InterFont.light, fontSize: 12.5, color: '#8C8C94', marginTop: 2 },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.lg,
  },
  ctaWrap: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
});

export default SignupProfileScreen;
