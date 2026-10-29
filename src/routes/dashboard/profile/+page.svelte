<script lang="ts">
  import { goto } from "$app/navigation";

  import { InitialProfile } from "@/lib/components";
  import { removeAuth } from "@/lib/services/auth";
  import { setTheme, theme } from "@/stores/theme";
  import { language, setLanguage, t } from "@/stores/translation";

  const mockData = {
    userId: "+6285156141278",
    allowChat: true,
    userName: "Ervan Jovian",
  };

  const onClickLogOut = async (): Promise<void> => {
    await removeAuth();
    await goto("/login");
  };
</script>

<section class="h-[calc(100dvh-6rem)] overflow-hidden bg-zinc-100">
  <article
    class="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-base-100 shadow-xl shadow-zinc-900/5"
  >
    <header
      class="profile-enter shrink-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 px-6 pt-6 pb-14 text-white"
    >
      <p class="text-xs font-semibold uppercase text-emerald-100">
        {t("profileAccount", $language)}
      </p>
      <h1 class="mt-2 text-3xl font-bold">
        {t("profileTitle", $language)}
      </h1>
    </header>

    <div
      class="profile-enter profile-enter-delay -mt-8 flex flex-col px-5 pb-6"
    >
      <div
        class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-md shadow-zinc-900/5"
      >
        <InitialProfile name={mockData.userName} />
        <div
          class="mt-4 flex items-center justify-between gap-3 border-t border-base-300 pt-3"
        >
          <span class="text-xs font-medium text-base-content/60">
            {t("numberTeL", $language)}
          </span>
          <span class="text-sm font-semibold text-base-content">
            {mockData.userId}
          </span>
        </div>
      </div>

      <section class="profile-enter profile-enter-delay-2 mt-7">
        <h2 class="mb-2 px-1 text-xs font-bold uppercase text-base-content/50">
          {t("profilePreferences", $language)}
        </h2>
        <div class="divide-y divide-base-300 border-y border-base-300">
          <fieldset class="flex flex-col gap-3 py-4">
            <legend class="text-sm font-semibold text-base-content">
              {t("languageLabel", $language)}
            </legend>
            <div class="join grid grid-cols-2">
              <label
                class="btn btn-sm join-item justify-start gap-2 border-base-300 bg-base-100 normal-case"
              >
                <input
                  type="radio"
                  name="profile-language"
                  class="radio radio-xs"
                  value="id"
                  checked={$language === "id"}
                  onchange={() => setLanguage("id")}
                />
                <span>Bahasa Indonesia</span>
              </label>
              <label
                class="btn btn-sm join-item justify-start gap-2 border-base-300 bg-base-100 normal-case"
              >
                <input
                  type="radio"
                  name="profile-language"
                  class="radio radio-xs"
                  value="en"
                  checked={$language === "en"}
                  onchange={() => setLanguage("en")}
                />
                <span>English</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="flex flex-col gap-3 py-4">
            <legend class="text-sm font-semibold text-base-content">
              {t("themeLabel", $language)}
            </legend>
            <div class="join grid grid-cols-2">
              <label
                class="btn btn-sm join-item justify-start gap-2 border-base-300 bg-base-100 normal-case"
              >
                <input
                  type="radio"
                  name="profile-theme"
                  class="radio radio-xs"
                  value="light"
                  checked={$theme === "light"}
                  onchange={() => setTheme("light")}
                />
                <span>{t("themeLight", $language)}</span>
              </label>
              <label
                class="btn btn-sm join-item justify-start gap-2 border-base-300 bg-base-100 normal-case"
              >
                <input
                  type="radio"
                  name="profile-theme"
                  class="radio radio-xs"
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
              <p class="text-sm font-semibold text-base-content">
                {t("allowChatLabel", $language)}
              </p>
              <p class="mt-0.5 text-xs text-base-content/50">WhatsApp</p>
            </div>
            <input
              type="checkbox"
              checked={mockData.allowChat}
              class="toggle toggle-sm toggle-success"
              aria-label={t("allowChatLabel", $language)}
            />
          </label>
        </div>
      </section>
    </div>

    <button
      onclick={onClickLogOut}
      type="button"
      class="profile-enter profile-enter-delay-3 btn btn-wide mb-5 mt-auto shrink-0 self-center gap-2 border-0 bg-rose-700 text-white hover:bg-rose-800"
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

<style>
  @keyframes profile-rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .profile-enter {
    animation: profile-rise 420ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
  }

  .profile-enter-delay {
    animation-delay: 80ms;
  }

  .profile-enter-delay-2 {
    animation-delay: 150ms;
  }

  .profile-enter-delay-3 {
    animation-delay: 220ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .profile-enter,
    .profile-enter-delay,
    .profile-enter-delay-2,
    .profile-enter-delay-3 {
      animation: none;
    }
  }
</style>
