import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import BasicInfoForm from '../../components/BasicInfoForm';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupBasicInfo'>;

/** Female-side wrapper around the shared BasicInfoForm. */
function FemaleSignupBasicInfoScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const handleOtpRequested = useCallback(
    (phone: string): void => {
      navigation.navigate('FemaleSignupOtp', { phone });
    },
    [navigation],
  );

  return <BasicInfoForm role={UserRole.Female} onOtpRequested={handleOtpRequested} />;
}

export default FemaleSignupBasicInfoScreen;
