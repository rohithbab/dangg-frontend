import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import BasicInfoForm from '../../components/BasicInfoForm';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'MaleSignupBasicInfo'>;

/** Male-side wrapper around the shared BasicInfoForm. */
function MaleSignupBasicInfoScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const handleOtpRequested = useCallback(
    (phone: string): void => {
      navigation.navigate('MaleSignupOtp', { phone });
    },
    [navigation],
  );

  const handlePickLogin = useCallback(
    (role: UserRole.Female | UserRole.Male): void => {
      navigation.navigate(role === UserRole.Female ? 'FemaleLogin' : 'MaleLogin');
    },
    [navigation],
  );

  return (
    <BasicInfoForm
      role={UserRole.Male}
      onOtpRequested={handleOtpRequested}
      onPickLogin={handlePickLogin}
    />
  );
}

export default MaleSignupBasicInfoScreen;
