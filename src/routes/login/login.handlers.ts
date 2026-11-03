import { createSupabaseClient } from '@/lib/services/supabase';

import { t } from "../../stores";


export const keyErrorMapper: Record<string, string> = {
  INVALID_CREDENTIALS: t("invalidCredentials"),
};

export const onSubmitLogin = async (email: string, password: string) => {
  const { data, error } = await createSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(error.code === 'invalid_credentials' ? 'INVALID_CREDENTIALS' : error.message);
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
    },
  };
};
