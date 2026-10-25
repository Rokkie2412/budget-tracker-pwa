// SVELTE AUTO MIDDLEWARE

import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { jwtVerify } from 'jose';

import { getJwtSecretKey } from '@/lib/utils/index.server';
import type { AuthPayload } from '@/types';

const PUBLIC_ROUTES = [
  '/api/login',
];

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  if (PUBLIC_ROUTES.includes(pathname)) {
    return resolve(event);
  }

  const authHeader = event.request.headers.get('authorization');
  event.locals.user = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const secretKey = getJwtSecretKey();
      const { payload } = await jwtVerify(token, secretKey);
      event.locals.user = payload as AuthPayload;
    } catch {
      event.locals.user = null;
    }
  }

  const isApiRoute = event.url.pathname.startsWith('/api');
  const isPublicApi = event.url.pathname === '/api/login';

  if (isApiRoute && !isPublicApi && !event.locals.user) {
    return json({ message: 'INVALID_TOKEN_KEY' }, { status: 401 });
  }

  return resolve(event);
};
