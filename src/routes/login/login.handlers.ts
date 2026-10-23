import { goto } from "$app/navigation";

import { checkAuth } from "../../lib/services/auth";
import {
  apiBaseUrl
} from "../../lib/utils";
import { t } from "../../stores";


export const keyErrorMapper: Record<string, string> = {
  PHONE_AND_PASSWORD_REQUIRED: t("phoneAndPasswordRequired"),
  INVALID_CREDENTIALS: t("invalidCredentials"),
  SERVER_ERROR: t("serverError"),
  REQUEST_BODY_MUST_BE_VALID_JSON: t("requestBodyMustBeValidJson"),
};

export const autoRouting = async () => {
  const auth = await checkAuth();

  if (auth) {
    goto('/dashboard')
  }
}

export const onSubmitLogin = async (phone: string, password: string) => {
  if (import.meta.env.MODE === "capacitor" && !apiBaseUrl) {
    throw new Error(t("apiNotConfigured"));
  }

  const res = await fetch(`${apiBaseUrl}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone,
      password,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message ?? t("loginFailed"));
  }

  return result;
};

export const handleSubmit = (event: SubmitEvent) => {
  event.preventDefault();
};

export const normalizePhoneNumber = (phone: string, phoneCallingCode: string): string => {
  const phoneDigits = phone.replace(/\D/g, '');
  const isInternational = /^(?:\+|00)/.test(phone.trim());
  const nationalNumber =
    isInternational && phoneDigits.startsWith(phoneCallingCode)
      ? phoneDigits.slice(phoneCallingCode.length)
      : phoneDigits;

  return phoneCallingCode + nationalNumber.replace(/^0+/, '');
};
