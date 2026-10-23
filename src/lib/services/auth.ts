import { Preferences } from '@capacitor/preferences';

import type { AuthCredential } from './auth.types'

const AUTH_KEY = 'auth';

export const setAuth = async (jwtToken: string, phoneNumber: string): Promise<void> => {
  const credential: AuthCredential = { jwtToken, phoneNumber };

  await Preferences.set({
    key: AUTH_KEY,
    value: JSON.stringify(credential)
  });
};

export const checkAuth = async (): Promise<AuthCredential | null> => {
  const { value } = await Preferences.get({ key: AUTH_KEY });

  if (value === null) {
    return null;
  }

  const credential: unknown = JSON.parse(value);
  if (
    typeof credential !== 'object' ||
    credential === null ||
    !('jwtToken' in credential) ||
    typeof credential.jwtToken !== 'string' ||
    !('phoneNumber' in credential) ||
    typeof credential.phoneNumber !== 'string'
  ) {
    throw new Error('Stored auth credential has an invalid format');
  }

  return {
    jwtToken: credential.jwtToken,
    phoneNumber: credential.phoneNumber
  };
};

export const removeAuth = async (): Promise<void> => {
  await Preferences.remove({ key: AUTH_KEY });
};
