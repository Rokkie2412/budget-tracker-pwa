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

  const changes = body as Record<string, unknown>;
  const hasPhoneNumber = Object.prototype.hasOwnProperty.call(
    changes,
    "phoneNumber",
  );
  const hasAllowChat = Object.prototype.hasOwnProperty.call(
    changes,
    "allowChat",
  );
  const phoneNumber = changes.phoneNumber;
  const allowChat = changes.allowChat;
  if (
    (!hasPhoneNumber && !hasAllowChat) ||
    (hasPhoneNumber &&
      (typeof phoneNumber !== "string" ||
        phoneNumber.length > 16 ||
        (phoneNumber !== "" && !/^\+[1-9]\d{1,14}$/.test(phoneNumber)))) ||
    (hasAllowChat && typeof allowChat !== "boolean")
  ) {
    return json({ message: "Invalid profile settings." }, { status: 400 });
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

  const currentPhoneNumber = currentUser.user.phone ?? "";
  const nextPhoneNumber = hasPhoneNumber
    ? (phoneNumber as string)
    : currentPhoneNumber;
  if (hasPhoneNumber && nextPhoneNumber !== currentPhoneNumber) {
    const userMetadata = { ...currentUser.user.user_metadata };
    delete userMetadata.allowChat;
    delete userMetadata.phoneNumber;
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        phone: nextPhoneNumber,
        user_metadata: userMetadata,
      },
    );
    if (updateError) {
      return json({ message: updateError.message }, { status: 400 });
    }
  }

  const shouldUpdateChat =
    hasAllowChat || (hasPhoneNumber && nextPhoneNumber === "");
  if (shouldUpdateChat) {
    const { data: currentPreferences, error: preferenceReadError } =
      await admin
        .from("user_preferences")
        .select("allow_chat")
        .eq("user_id", userId)
        .maybeSingle();
    if (preferenceReadError) {
      return json(
        { message: "Could not load the chat preference." },
        { status: 500 },
      );
    }

    const nextAllowChat = Boolean(nextPhoneNumber) && Boolean(allowChat);
    if ((currentPreferences?.allow_chat ?? false) !== nextAllowChat) {
      const { error: preferenceError } = await admin
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            allow_chat: nextAllowChat,
          },
          { onConflict: "user_id" },
        );
      if (preferenceError) {
        console.error("Could not save the chat preference.", preferenceError);
        return json(
          {
            message: hasPhoneNumber
              ? "Phone number was updated, but chat preference could not be saved."
              : "Could not save the chat preference.",
          },
          { status: 500 },
        );
      }
    }
  }

  return json({ message: "Profile settings saved." });
};
