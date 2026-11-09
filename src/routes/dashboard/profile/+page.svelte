<script lang="ts">
  import { parsePhoneNumberFromString } from "libphonenumber-js";
  import { onMount } from "svelte";

  import { goto } from "$app/navigation";

  import { InitialProfile, LoadingMask } from "@/lib/components";
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
  let savedPhoneNumber = $state("");
  let allowChat = $state(false);
  let savedAllowChat = $state(false);
  let selectedLanguage = $state($language);
  let selectedTheme = $state($theme);
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
      selectedLanguage = $language;
      selectedTheme = $theme;
      userName = settings.name;
      phoneNumber = settings.phoneNumber;
      const savedPhone = parsePhoneNumberFromString(
        settings.phoneNumber,
        "ID",
      );
      savedPhoneNumber = savedPhone?.isValid()
        ? savedPhone.number
        : settings.phoneNumber.trim();
      allowChat = settings.allowChat;
      savedAllowChat = settings.allowChat;
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

    const nextPhoneNumber = normalizedPhoneNumber;
    const phoneNumberChanged = validPhoneNumber
      ? nextPhoneNumber !== savedPhoneNumber
      : phoneNumber.trim() !== savedPhoneNumber;
    if (phoneNumberChanged && phoneNumber.trim() && !validPhoneNumber) {
      showToast(t("invalidPhoneNumber", $language), "error");
      return;
    }

    const nextAllowChat = allowChat && nextPhoneNumber.length > 0;
    const allowChatChanged = nextAllowChat !== savedAllowChat;
    const hasRemoteChanges = phoneNumberChanged || allowChatChanged;
    isSaving = hasRemoteChanges;

    try {
      if (hasRemoteChanges) {
        await saveProfileSettings({
          ...(phoneNumberChanged ? { phoneNumber: nextPhoneNumber } : {}),
          ...(allowChatChanged ? { allowChat: nextAllowChat } : {}),
        });
      }

      if (phoneNumberChanged) {
        phoneNumber = nextPhoneNumber;
        savedPhoneNumber = nextPhoneNumber;
      } else if (validPhoneNumber) {
        phoneNumber = nextPhoneNumber;
      }
      allowChat = nextAllowChat;
      savedAllowChat = nextAllowChat;
      setLanguage(selectedLanguage);
      setTheme(selectedTheme);
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

  const handleAllowChatClick = (event: MouseEvent) => {
    if (canUseWhatsApp) return;

    event.preventDefault();
    showToast(t("whatsappPhoneRequired", $language), "error");
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

<section
  class="motion-page h-[calc(100dvh-6rem)] overflow-hidden bg-zinc-100 dark:bg-zinc-800"
  aria-busy={isLoading || isSaving}
>
  <article
    class="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl shadow-zinc-900/5 dark:bg-zinc-900"
  >
    <header
      class="shrink-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-14 text-white"
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
      <form onsubmit={saveSettings} aria-busy={isLoading || isSaving}>
        {#if isLoading}
          <div role="status" aria-label={t("loading", $language)}>
            <div class="motion-card rounded-xl border border-zinc-200 bg-white p-4 shadow-md shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900">
              <div class="flex items-center gap-3">
                <span class="motion-skeleton size-20 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"></span>
                <span class="flex-1 space-y-2">
                  <span class="motion-skeleton block h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                  <span class="motion-skeleton block h-3 w-40 max-w-full rounded bg-zinc-200 dark:bg-zinc-700"></span>
                </span>
                <span
                  class="motion-loading-spinner size-5 shrink-0 rounded-full border-2 border-emerald-700 border-r-transparent"
                  aria-hidden="true"
                ></span>
              </div>
              <div class="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <span class="motion-skeleton mb-2 block h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                <span class="motion-skeleton block h-12 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
              </div>
            </div>

            <div class="motion-card mt-7 space-y-4">
              <span class="motion-skeleton mb-2 block h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              <div class="space-y-4 border-y border-zinc-200 py-4 dark:border-zinc-700">
                <span class="motion-skeleton block h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                <div class="grid grid-cols-2 gap-2">
                  <span class="motion-skeleton h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
                  <span class="motion-skeleton h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
                </div>
                <span class="motion-skeleton block h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                <div class="grid grid-cols-2 gap-2">
                  <span class="motion-skeleton h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
                  <span class="motion-skeleton h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
                </div>
                <span class="motion-skeleton block h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
              </div>
              <span class="motion-skeleton block h-11 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
          </div>
        {:else}

        <div
          class="motion-card rounded-xl border border-zinc-200 bg-white p-4 shadow-md shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900"
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
                  checked={selectedLanguage === "id"}
                  onchange={() => (selectedLanguage = "id")}
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
                  checked={selectedLanguage === "en"}
                  onchange={() => (selectedLanguage = "en")}
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
                  checked={selectedTheme === "light"}
                  onchange={() => (selectedTheme = "light")}
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
                  checked={selectedTheme === "dark"}
                  onchange={() => (selectedTheme = "dark")}
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
              disabled={isLoading || isSaving}
              aria-disabled={!canUseWhatsApp}
              onclick={handleAllowChatClick}
              class="size-5 accent-emerald-700"
              class:cursor-not-allowed={!canUseWhatsApp}
              class:opacity-50={!canUseWhatsApp}
              aria-label={t("allowChatLabel", $language)}
            />
          </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={isLoading || isSaving}
          class="motion-tap mt-5 flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {#if isSaving}
            {t("loading", $language)}
          {:else}
            {t("saveProfileSettings", $language)}
          {/if}
        </button>
        {/if}
      </form>
    </div>

    <button
      onclick={onClickLogOut}
      type="button"
      class="motion-tap mb-5 mt-auto flex min-h-11 shrink-0 items-center justify-center gap-2 self-center rounded-lg bg-rose-700 px-5 font-semibold text-white hover:bg-rose-800"
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

{#if isSaving}
  <LoadingMask text={t("loading", $language)} />
{/if}
