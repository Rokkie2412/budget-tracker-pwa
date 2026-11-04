import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_SUPABASE_URL_DEV: { public: true, static: true },
  PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV: { public: true, static: true },
  PUBLIC_SUPABASE_URL: { public: true, static: true },
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
  ENCRYPTION_KEY: {
    description: "Server-only key with at least 32 bytes used to encrypt transaction descriptions.",
    schema: (value) => value,
  },
});
