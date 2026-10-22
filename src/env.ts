import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  MONGO_URI_PROD: {},
  MONGO_URI_DEV: {},
  ENCRYPTION_KEY: {},
  STATIC_SALT: {},
});
