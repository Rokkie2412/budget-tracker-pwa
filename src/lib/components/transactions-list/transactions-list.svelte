<script lang="ts">
  import { getCategoryTranslationKey } from "@/i18n";
  import { language, t } from "@/stores/translation";

  import { getCategoryEmoji } from "./transactions-list.handlers";
  import type { Props } from "./transactions-list.types";

  let {
    title,
    category,
    date,
    amount,
    type = "OUT",
    onDelete,
    isDeleting = false,
  }: Props = $props();
</script>

<article class="w-full border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
  <div class="flex items-center justify-between gap-3 px-3 py-2.5">
    <div class="flex min-w-0 items-center gap-1 sm:gap-4">
      <div class="min-w-0">
        <h2 class="truncate text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {title}
        </h2>
        <p
          class="mt-1 flex items-center gap-1 truncate text-sm leading-5 text-zinc-500 dark:text-zinc-400"
        >
          {category ? t(getCategoryTranslationKey(category), $language) : ""}
          {getCategoryEmoji(category, type)} • {date}
        </p>
      </div>
    </div>

    {#if amount}
      <p
        class={`shrink-0 text-right text-sm font-bold tabular-nums ${type === "IN" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700"}`}
      >
        {amount}
      </p>
    {/if}

    {#if onDelete}
      <div class="shrink-0">
        <button
          type="button"
          class="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-zinc-400 dark:hover:bg-rose-950 dark:hover:text-rose-300"
          aria-label={t(isDeleting ? "deletingTransaction" : "deleteTransaction", $language).replace("{title}", title)}
          disabled={isDeleting}
          onclick={onDelete}
        >
          {#if isDeleting}
            <span class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true"></span>
          {:else}
            <svg
            aria-hidden="true"
            class="size-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m19 6-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
            </svg>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</article>
