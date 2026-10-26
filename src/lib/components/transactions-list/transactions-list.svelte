<script lang="ts">
  import { getCategoryEmoji } from "./transactions-list.handlers";
  import type { Props } from "./transactions-list.types";

  let {
    title,
    category,
    date,
    amount,
    type = "OUT",
    onDelete,
  }: Props = $props();
</script>

<article class="card w-full border-zinc-300 bg-white">
  <div class="card-body flex-row items-center justify-between px-3 py-2.5">
    <div class="flex min-w-0 items-center gap-1 sm:gap-4">
      <div class="min-w-0">
        <h2 class="card-title truncate text-base font-semibold text-zinc-800">
          {title}
        </h2>
        <p
          class="mt-1 flex items-center gap-1 truncate text-sm leading-5 text-zinc-500"
        >
          {category}
          {getCategoryEmoji(category, type)} • {date}
        </p>
      </div>
    </div>

    {#if amount}
      <p
        class={`shrink-0 text-right text-sm font-bold tabular-nums ${type === "IN" ? "text-emerald-700" : "text-red-700"}`}
      >
        {amount}
      </p>
    {/if}

    {#if onDelete}
      <div class="card-actions shrink-0">
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm text-zinc-500 hover:bg-rose-50 hover:text-rose-700"
          aria-label={`Hapus ${title}`}
          onclick={onDelete}
        >
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
        </button>
      </div>
    {/if}
  </div>
</article>
