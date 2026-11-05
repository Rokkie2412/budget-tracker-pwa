import { checkAuth, setAuth } from "@/lib/services/auth";
import { createSupabaseClient } from "@/lib/services/supabase";

export type ProfileSettings = {
  name: string;
  phoneNumber: string;
  allowChat: boolean;
};

const getAuthenticatedClient = async () => {
  const credentials = await checkAuth();
  if (!credentials) throw new Error("You must be signed in to update profile settings.");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
  });
  if (error || !data.user || !data.session) {
    throw error ?? new Error("Could not restore the signed-in session.");
  }

  return { supabase, user: data.user, fallbackEmail: credentials.email };
};

const persistCurrentSession = async (
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>["supabase"],
  fallbackEmail: string,
): Promise<void> => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw error ?? new Error("Could not persist the signed-in session.");
  }

  await setAuth({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + data.session.expires_in,
    userId: data.session.user.id,
    email: data.session.user.email ?? fallbackEmail,
  });
};

export const fetchProfileSettings = async (): Promise<ProfileSettings> => {
  const credentials = await checkAuth();
  if (!credentials) throw new Error("You must be signed in to view profile settings.");

  const { data, error } = await createSupabaseClient().auth.getUser(
    credentials.accessToken,
  );
  if (error) throw error;

  const metadata = data.user.user_metadata ?? {};
  const phoneNumber =
    typeof metadata.phoneNumber === "string"
      ? metadata.phoneNumber
      : data.user.phone ?? "";
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";

  return {
    name: metadataName || data.user.email || "",
    phoneNumber,
    allowChat: Boolean(phoneNumber) && metadata.allowChat === true,
  };
};

export const saveProfileSettings = async (
  phoneNumber: string,
  allowChat: boolean,
): Promise<void> => {
  const { supabase, user, fallbackEmail } = await getAuthenticatedClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      phoneNumber,
      allowChat: Boolean(phoneNumber) && allowChat,
    },
  });
  if (error) throw error;
  await persistCurrentSession(supabase, fallbackEmail);
};