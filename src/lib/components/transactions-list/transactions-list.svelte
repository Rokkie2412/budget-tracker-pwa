<script lang="ts">
  type Props = {
    title: string;
    subtitle: string;
    amount?: string;
    type?: "IN" | "OUT";
    onDelete?: () => void;
  };

  let { title, subtitle, amount, type = "OUT", onDelete }: Props = $props();
</script>

<article
  class="card w-full border border-zinc-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
>
  <div class="card-body flex-row items-center justify-between gap-3 p-4 sm:gap-4 sm:p-5">
    <div class="flex min-w-0 items-center gap-3 sm:gap-4">
      <span
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-900"
      >
        <svg
          aria-hidden="true"
          class="size-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
          <path d="M14 3.75v4h4M8.5 12h7M8.5 15.5h7" />
        </svg>
      </span>

      <div class="min-w-0">
        <h2 class="card-title truncate text-base font-semibold text-zinc-900">{title}</h2>
        <p class="mt-1 truncate text-sm leading-5 text-zinc-500">{subtitle}</p>
      </div>

    </div>

    {#if amount}
      <p
        class={`shrink-0 text-right text-sm font-bold tabular-nums ${type === "IN" ? "text-emerald-700" : "text-zinc-900"}`}
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