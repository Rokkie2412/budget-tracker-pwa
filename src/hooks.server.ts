// SVELTE AUTO MIDDLEWARE

import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';

import { createSupabaseClient } from '@/lib/services/supabase';

export const handle: Handle = async ({ event, resolve }) => {
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

  const isApiRoute = event.url.pathname.startsWith('/api');
  if (isApiRoute && !event.locals.user) {
    return json({ message: 'INVALID_TOKEN_KEY' }, { status: 401 });
  }

  return resolve(event);
};
