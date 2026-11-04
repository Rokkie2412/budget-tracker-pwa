import { createSupabaseClient } from '@/lib/services/supabase';

import { t } from "../../stores";


export const keyErrorMapper: Record<string, string> = {
  INVALID_CREDENTIALS: t("invalidCredentials"),
  EMAIL_NOT_CONFIRMED: t("emailNotConfirmed"),
};

export const onSubmitLogin = async (email: string, password: string) => {
  const { data, error } = await createSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    if (error.code === 'invalid_credentials') {
      throw new Error('INVALID_CREDENTIALS');
    }
    if (error.code === 'email_not_confirmed') {
      throw new Error('EMAIL_NOT_CONFIRMED');
    }
    throw new Error(error.message);
  }
  if (!data.session || !data.user) {
    throw new Error(t("loginFailed"));
  }

  return {
    message: 'LOGIN_SUCCESS',
    credential: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + data.session.expires_in,
      userId: data.user.id,
      email: data.user.email ?? email.trim(),
      phoneNumber: null,
      allowChat: false,
    },
  };
};
