<script lang="ts">
  import { type Snippet } from "svelte";

  import { page } from "$app/state";

  import { AddTransaction } from "@/lib/components";

  let { children }: { children: Snippet } = $props();
</script>

<main class="keyboard-adjustable-content pb-24">
  {@render children()}
</main>

<nav
  aria-label="Navigasi utama"
  class="fixed inset-x-0 bottom-0 z-50 mx-auto grid min-h-16 max-w-md grid-cols-5 border-t border-zinc-200 bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] text-zinc-500 shadow-[0_-4px_16px_rgba(24,24,27,0.06)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
>
  <a
    href="/dashboard"
    aria-current={page.url.pathname === "/dashboard" ? "page" : undefined}
    class={`motion-nav-item motion-tap flex flex-col items-center justify-center gap-1 text-xs ${page.url.pathname === "/dashboard" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
  >
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
      />
    </svg>
    <span>Beranda</span>
  </a>

  <a
    href="/dashboard/transactions"
    aria-current={page.url.pathname === "/dashboard/transactions"
      ? "page"
      : undefined}
    class={`motion-nav-item motion-tap flex flex-col items-center justify-center gap-1 text-xs ${page.url.pathname === "/dashboard/transactions" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
  >
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M7 7h14m0 0-3-3m3 3-3 3M17 17H3m0 0 3 3m-3-3 3-3"
      />
    </svg>
    <span>Transaksi</span>
  </a>

  <AddTransaction />

  <a
    href="/dashboard/reports"
    aria-current={page.url.pathname === "/dashboard/reports"
      ? "page"
      : undefined}
    class={`motion-nav-item motion-tap flex flex-col items-center justify-center gap-1 text-xs ${page.url.pathname === "/dashboard/reports" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
  >
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7"
      />
    </svg>
    <span>Laporan</span>
  </a>

  <a
    href="/dashboard/profile"
    aria-current={page.url.pathname === "/dashboard/profile"
      ? "page"
      : undefined}
    class={`motion-nav-item motion-tap flex flex-col items-center justify-center gap-1 text-xs ${page.url.pathname === "/dashboard/profile" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
  >
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"
      />
    </svg>
    <span>Profil</span>
  </a>
</nav>
