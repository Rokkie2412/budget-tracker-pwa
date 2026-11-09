import { createClient } from '@supabase/supabase-js';

import { dev } from '$app/env';
import {
	PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV,
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_URL_DEV,
} from '$app/env/public';

const supabaseUrl = dev ? PUBLIC_SUPABASE_URL_DEV : PUBLIC_SUPABASE_URL;
const supabaseKey = dev
	? PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV
	: PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createSupabaseClient = (accessToken?: string) =>
	createClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			detectSessionInUrl: false,
			persistSession: false,
		},
		global: accessToken
			? { headers: { Authorization: `Bearer ${accessToken}` } }
			: undefined,
	});