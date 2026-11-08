import { createClient } from "@supabase/supabase-js";
import { json, type RequestHandler } from "@sveltejs/kit";

import { dev } from "$app/env";
import {
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY_DEV,
} from "$app/env/private";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_URL_DEV,
} from "$app/env/public";

export const PATCH: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.userId;
  if (!userId) return json({ message: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ message: "Invalid profile settings." }, { status: 400 });
  }

  const { phoneNumber, allowChat } = body as Record<string, unknown>;
  if (
    typeof phoneNumber !== "string" ||
    phoneNumber.length > 16 ||
    (phoneNumber !== "" && !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) ||
    typeof allowChat !== "boolean"
  ) {
    return json({ message: "Enter a valid international phone number." }, { status: 400 });
  }

  const serviceRoleKey = dev
    ? SUPABASE_SERVICE_ROLE_KEY_DEV
    : SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return json(
      { message: "Server phone updates are not configured." },
      { status: 503 },
    );
  }

  const supabaseUrl = dev ? PUBLIC_SUPABASE_URL_DEV : PUBLIC_SUPABASE_URL;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data: currentUser, error: readError } =
    await admin.auth.admin.getUserById(userId);
  if (readError || !currentUser.user) {
    return json({ message: "Could not load the signed-in profile." }, { status: 502 });
  }

  const attributes = {
    user_metadata: {
      ...currentUser.user.user_metadata,
      phoneNumber,
      allowChat: Boolean(phoneNumber) && allowChat,
    },
    ...(phoneNumber !== (currentUser.user.phone ?? "")
      ? { phone: phoneNumber }
      : {}),
  };
  const { error: updateError } = await admin.auth.admin.updateUserById(
    userId,
    attributes,
  );
  if (updateError) {
    return json({ message: updateError.message }, { status: 400 });
  }

  return json({ message: "Profile settings saved." });
};
