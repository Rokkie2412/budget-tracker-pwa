<script lang="ts">
  import { goto } from "$app/navigation";

  import { InitialProfile } from "../../../lib/components";
  import { removeAuth } from "../../../lib/services/auth";
  import { language, setLanguage, t } from "../../../stores/translation";

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

<section
  data-theme="light"
  class="h-[calc(100dvh-6rem)] overflow-hidden bg-zinc-100"
>
  <article
    class="mx-auto flex h-full w-full max-w-md flex-col bg-white px-6 py-5 shadow-xl shadow-zinc-900/5"
  >
    <header class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Profile</h1>
    </header>

    <div class="flex flex-col items-center">
      <InitialProfile name={mockData.userName} />

      <div
        class="mt-8 w-full divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white px-4"
      >
        <div class="divide-y divide-zinc-100">
          <div class="flex min-h-16 items-center justify-between gap-4 py-3">
            <p class="text-sm font-medium text-zinc-500">
              {t("numberTeL", $language)}
            </p>
            <p class="text-right text-sm font-semibold text-zinc-900">
              {mockData.userId}
            </p>
          </div>
          <label class="flex min-h-16 items-center justify-between gap-4 py-3">
            <p class="text-sm font-medium text-zinc-500">
              {t("allowChatLabel", $language)}
            </p>
            <input
              type="checkbox"
              checked
              class="toggle toggle-sm"
              aria-label="Allow Chat Feature"
            />
          </label>
        </div>

        <fieldset
          class="flex flex-row min-h-16 items-center justify-between gap-3 py-3"
        >
          <p class="text-sm font-medium text-zinc-500">
            {t("languageLabel", $language)}
          </p>
          <div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <label class="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="profile-language"
                class="radio radio-sm"
                value="id"
                checked={$language === "id"}
                onchange={() => setLanguage("id")}
              />
              <span class="text-xs font-medium text-zinc-700"
                >Bahasa Indonesia</span
              >
            </label>
            <label class="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="profile-language"
                class="radio radio-sm"
                value="en"
                checked={$language === "en"}
                onchange={() => setLanguage("en")}
              />
              <span class="text-xs font-medium text-zinc-700">English</span>
            </label>
          </div>
        </fieldset>
      </div>
    </div>

    <button
      onclick={onClickLogOut}
      type="button"
      class="btn btn-wide mt-auto self-center gap-2 border-0 bg-red-800 text-white hover:bg-red-900"
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
