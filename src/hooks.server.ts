// SVELTE AUTO MIDDLEWARE

import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';

import { createSupabaseClient } from '@/lib/services/supabase';

// The Capacitor app runs from https://localhost and calls this API cross-origin,
// so every /api/* response must carry CORS headers. Auth uses a Bearer token
// (not cookies), so a wildcard origin is safe here.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const withCors = (isApiRoute: boolean, response: Response): Response => {
  if (isApiRoute) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
};

export const handle: Handle = async ({ event, resolve }) => {
  const isApiRoute = event.url.pathname.startsWith('/api');

  // Answer CORS preflight requests before the auth check.
  if (isApiRoute && event.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const authHeader = event.request.headers.get('Authorization');
  event.locals.user = null;
  event.locals.supabase = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        event.locals.supabase = supabase;
        event.locals.user = {
          userId: data.user.id,
          email: data.user.email ?? '',
        };
      }
    } catch {
      event.locals.user = null;
    }
  }

  if (isApiRoute && !event.locals.user) {
    return json({ message: 'INVALID_TOKEN_KEY' }, { status: 401, headers: CORS_HEADERS });
  }

  return withCors(isApiRoute, await resolve(event));
};
