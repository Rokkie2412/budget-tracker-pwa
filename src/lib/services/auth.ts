import { Preferences } from '@capacitor/preferences';

import type { AuthCredential } from './auth.types'
import { createSupabaseClient } from './supabase';

const AUTH_KEY = 'auth';

export const setAuth = async (credential: AuthCredential): Promise<void> => {

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
    !('accessToken' in credential) ||
    typeof credential.accessToken !== 'string' ||
    !('refreshToken' in credential) ||
    typeof credential.refreshToken !== 'string' ||
    !('expiresAt' in credential) ||
    typeof credential.expiresAt !== 'number' ||
    !('userId' in credential) ||
    typeof credential.userId !== 'string' ||
    !('email' in credential) ||
    typeof credential.email !== 'string'
  ) {
    throw new Error('Stored auth credential has an invalid format');
  }

  const auth = credential as AuthCredential;
  if (auth.expiresAt > Date.now() / 1000 + 60) return auth;

  const { data, error } = await createSupabaseClient().auth.refreshSession({
    refresh_token: auth.refreshToken,
  });
  if (error || !data.session || !data.user) {
    await removeAuth();
    return null;
  }

  const refreshedCredential: AuthCredential = {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + data.session.expires_in,
    userId: data.user.id,
    email: data.user.email ?? auth.email,
  };
  await setAuth(refreshedCredential);
  return refreshedCredential;
};

export const removeAuth = async (): Promise<void> => {
  await Preferences.remove({ key: AUTH_KEY });
};
