<script lang="ts">
  import { parsePhoneNumberFromString } from "libphonenumber-js";
  import { onMount } from "svelte";

  import { goto } from "$app/navigation";

  import { InitialProfile } from "@/lib/components";
  import { removeAuth } from "@/lib/services/auth";
  import {
    fetchProfileSettings,
    saveProfileSettings,
  } from "@/lib/services/profile";
  import { setTheme, theme } from "@/stores/theme";
  import { showToast } from "@/stores/toast";
  import { language, setLanguage, t } from "@/stores/translation";

  let userName = $state("");
  let phoneNumber = $state("");
  let allowChat = $state(false);
  let isLoading = $state(true);
  let isSaving = $state(false);
  const parsedPhoneNumber = $derived(
    parsePhoneNumberFromString(phoneNumber.trim(), "ID"),
  );
  const validPhoneNumber = $derived(parsedPhoneNumber?.isValid() ?? false);
  const normalizedPhoneNumber = $derived(
    validPhoneNumber && parsedPhoneNumber ? parsedPhoneNumber.number : "",
  );
  const canUseWhatsApp = $derived(normalizedPhoneNumber.length > 0);

  const loadProfileSettings = async () => {
    try {
      const settings = await fetchProfileSettings();
      userName = settings.name;
      phoneNumber = settings.phoneNumber;
      allowChat = settings.allowChat;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t("profileLoadFailed", $language),
        "error",
      );
    } finally {
      isLoading = false;
    }
  };

  const saveSettings = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSaving) return;

    if (phoneNumber.trim() && !validPhoneNumber) {
      showToast(t("invalidPhoneNumber", $language), "error");
      return;
    }

    isSaving = true;

    try {
      await saveProfileSettings(normalizedPhoneNumber, allowChat && canUseWhatsApp);
      phoneNumber = normalizedPhoneNumber;
      showToast(t("profileSettingsSaved", $language), "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t("profileSettingsSaveFailed", $language),
        "error",
      );
    } finally {
      isSaving = false;
    }
  };

  $effect(() => {
    if (!canUseWhatsApp) allowChat = false;
  });

  onMount(() => {
    void loadProfileSettings();
  });

  const onClickLogOut = async (): Promise<void> => {
    await removeAuth();
    await goto("/login");
  };
</script>

<section class="h-[calc(100dvh-6rem)] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
  <article
    class="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl shadow-zinc-900/5 dark:bg-zinc-900"
  >
    <header
      class="shrink-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 px-6 pt-6 pb-14 text-white"
    >
      <p class="text-xs font-semibold uppercase text-emerald-100">
        {t("profileAccount", $language)}
      </p>
      <h1 class="mt-2 text-3xl font-bold">
        {t("profileTitle", $language)}
      </h1>
    </header>

    <div
      class="-mt-8 flex flex-col px-5 pb-6"
    >
      <form onsubmit={saveSettings}>
        <div
          class="rounded-xl border border-zinc-200 bg-white p-4 shadow-md shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <InitialProfile name={userName || t("profileTitle", $language)} />
          <label class="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("numberTeL", $language)}
            </span>
            <input
              type="tel"
              name="phoneNumber"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+62 812 3456 7890"
              bind:value={phoneNumber}
              disabled={isLoading || isSaving}
              class="h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <span class="text-xs text-zinc-500 dark:text-zinc-400">
              {t("phoneNumberFormatHint", $language)}
            </span>
          </label>
        </div>

        <section class="mt-7">
          <h2 class="mb-2 px-1 text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
            {t("profilePreferences", $language)}
          </h2>
          <div class="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          <fieldset class="flex flex-col gap-3 py-4">
            <legend class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("languageLabel", $language)}
            </legend>
            <div class="grid grid-cols-2 gap-2">
              <label
                class="flex min-h-10 items-center justify-start gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <input
                  type="radio"
                  name="profile-language"
                  class="size-4 accent-emerald-700"
                  value="id"
                  checked={$language === "id"}
                  onchange={() => setLanguage("id")}
                />
                <span>Bahasa Indonesia</span>
              </label>
              <label
                class="flex min-h-10 items-center justify-start gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <input
                  type="radio"
                  name="profile-language"
                  class="size-4 accent-emerald-700"
                  value="en"
                  checked={$language === "en"}
                  onchange={() => setLanguage("en")}
                />
                <span>English</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="flex flex-col gap-3 py-4">
            <legend class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("themeLabel", $language)}
            </legend>
            <div class="grid grid-cols-2 gap-2">
              <label
                class="flex min-h-10 items-center justify-start gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <input
                  type="radio"
                  name="profile-theme"
                  class="size-4 accent-emerald-700"
                  value="light"
                  checked={$theme === "light"}
                  onchange={() => setTheme("light")}
                />
                <span>{t("themeLight", $language)}</span>
              </label>
              <label
                class="flex min-h-10 items-center justify-start gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <input
                  type="radio"
                  name="profile-theme"
                  class="size-4 accent-emerald-700"
                  value="dark"
                  checked={$theme === "dark"}
                  onchange={() => setTheme("dark")}
                />
                <span>{t("themeDark", $language)}</span>
              </label>
            </div>
          </fieldset>

          <label class="flex min-h-16 items-center justify-between gap-4 py-4">
            <div>
              <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("allowChatLabel", $language)}
              </p>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {#if canUseWhatsApp}
                  WhatsApp
                {:else}
                  {t("whatsappPhoneRequired", $language)}
                {/if}
              </p>
            </div>
            <input
              type="checkbox"
              bind:checked={allowChat}
              disabled={!canUseWhatsApp || isLoading || isSaving}
              class="size-5 accent-emerald-700"
              aria-label={t("allowChatLabel", $language)}
            />
          </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={isLoading || isSaving}
          class="mt-5 flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {#if isSaving}
            {t("loading", $language)}
          {:else}
            {t("saveProfileSettings", $language)}
          {/if}
        </button>
      </form>
    </div>

    <button
      onclick={onClickLogOut}
      type="button"
      class="mb-5 mt-auto flex min-h-11 shrink-0 items-center justify-center gap-2 self-center rounded-lg bg-rose-700 px-5 font-semibold text-white hover:bg-rose-800"
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        class="size-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14 8V5.75A1.75 1.75 0 0 0 12.25 4h-6.5A1.75 1.75 0 0 0 4 5.75v12.5A1.75 1.75 0 0 0 5.75 20h6.5A1.75 1.75 0 0 0 14 18.25V16m-3-4h9m0 0-3.5-3.5M20 12l-3.5 3.5"
        />
      </svg>
      {t("logOutButtonLabel", $language)}
    </button>
  </article>
</section>
