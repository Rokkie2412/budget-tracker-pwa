<script lang="ts">
  import { createEventDispatcher } from "svelte";

  let { totalPages, page } = $props();

  const dispatch = createEventDispatcher<{ pageChange: number }>();

  const btnClass =
    "w-10 h-10 flex justify-center items-center border-none bg-transparent rounded-md cursor-pointer text-zinc-900 transition-colors duration-150 hover:bg-zinc-900/8 disabled:opacity-35 disabled:cursor-not-allowed";
</script>

<div class="flex flex-row items-center justify-center gap-2">
  <button
    onclick={() => dispatch("pageChange", page - 1)}
    disabled={page === 1}
    class={btnClass}
    aria-label="Previous page"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

  <span
    class="text-[0.925rem] font-semibold text-zinc-900 min-w-16 text-center"
  >
    {page} / {totalPages}
  </span>

  <button
    onclick={() => dispatch("pageChange", page + 1)}
    disabled={page === totalPages}
    class={btnClass}
    aria-label="Next page"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
</div>
