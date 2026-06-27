import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

import GradientAvatar from '@core/components/GradientAvatar';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { useSessionRole } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import { type Profile, getProfile, updateProfile } from '../api/profileApi';
import EditProfilePicSheet from '../components/EditProfilePicSheet';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'EditProfile'>;

const MIN_AGE = 18;
const MAX_AGE = 100;

/**
 * E29 · Edit profile (shared, both roles). Cancel / Save header, gradient
 * avatar with "Change photo", and name / age / bio fields (bio shown for
 * females only). Saves via the existing profileApi.updateProfile.
 */
function EditProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const role = useSessionRole();
  const isFemale = role === UserRole.Female;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [picSheetOpen, setPicSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(p => {
        setProfile(p);
        setName(p.name);
        setAge(p.age != null ? String(p.age) : '');
        setBio(p.bio ?? '');
        setAvatarUrl(p.avatarUrl);
      })
      .catch(e => logger.error('EditProfileScreen.load failed', e));
  }, []);

  const ageNum = Number.parseInt(age, 10);
  const ageOk =
    age.length === 0 || (Number.isFinite(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE);
  const canSave = name.trim().length > 0 && ageOk && !saving;

  const handleSave = useCallback(async (): Promise<void> => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (!ageOk) {
      setError(`Age must be between ${MIN_AGE} and ${MAX_AGE}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        age: age.length > 0 ? ageNum : null,
        ...(isFemale ? { bio: bio.trim() } : {}),
      });
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      setError(e instanceof AppException ? e.message : 'Could not save, try again');
      if (!(e instanceof AppException)) {
        logger.error('EditProfileScreen.save failed', e);
      }
    }
  }, [age, ageNum, ageOk, bio, isFemale, name, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            disabled={!canSave}
            onPress={() => {
              void handleSave();
            }}
          >
            <Text style={[styles.save, !canSave && styles.saveDisabled]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.avatarWrap} onPress={() => setPicSheetOpen(true)}>
            <GradientAvatar
              initials={(name || profile?.name || 'You').slice(0, 1).toUpperCase()}
              seed={name || profile?.name || 'You'}
              uri={avatarUrl}
              size={96}
            />
            <View style={styles.cameraBadge}>
              <Camera size={14} color="#FFFFFF" strokeWidth={2} />
            </View>
          </Pressable>
          <Pressable onPress={() => setPicSheetOpen(true)} hitSlop={8}>
            <Text style={styles.changePhoto}>Change photo</Text>
          </Pressable>

          <Text style={styles.label}>DISPLAY NAME</Text>
          <View style={styles.field}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={t => {
                setName(t);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Your name"
              placeholderTextColor={AppColors.onSurfaceDisabled}
              autoCapitalize="words"
              maxLength={30}
            />
          </View>

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
              placeholderTextColor={AppColors.onSurfaceDisabled}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {isFemale ? (
            <>
              <Text style={styles.label}>BIO</Text>
              <View style={[styles.field, styles.bioField]}>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people a little about yourself"
                  placeholderTextColor={AppColors.onSurfaceDisabled}
                  multiline
                  maxLength={160}
                />
              </View>
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <EditProfilePicSheet
        visible={picSheetOpen}
        onClose={() => setPicSheetOpen(false)}
        onAvatarChanged={url => setAvatarUrl(url)}
        hasExistingPhoto={avatarUrl != null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    height: 52,
  },
  cancel: { fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurfaceMuted },
  headerTitle: { fontFamily: InterFont.medium, fontSize: 16, color: AppColors.onSurface },
  save: { fontFamily: InterFont.semibold, fontSize: 15, color: AppColors.primary },
  saveDisabled: { color: AppColors.onSurfaceDisabled },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
  },
  avatarWrap: { alignSelf: 'center' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.primary,
    borderWidth: 2,
    borderColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    fontFamily: InterFont.medium,
    fontSize: 13.5,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: AppSpacing.sm,
  },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#6B6B73',
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  field: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#0E0E10',
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  bioField: { minHeight: 100, paddingVertical: 12 },
  input: { fontFamily: InterFont.regular, fontSize: 16, color: AppColors.onSurface, padding: 0 },
  bioInput: { minHeight: 76, textAlignVertical: 'top' },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.lg,
  },
});

export default EditProfileScreen;
