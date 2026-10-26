<script lang="ts">
  import { TransactionCard } from "@/lib/components";

  import type { Props } from './transactions.types'

  let { data }: Props = $props();
  const transactions = $derived(data.transactions.data?.transactions ?? []);
  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }
</script>

<main
  data-theme="light"
  class="flex h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden bg-zinc-100 px-4 pt-6 sm:px-6"
>
  <section class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-5">
    <header class="flex shrink-0 items-end justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Riwayat keuangan
        </p>
        <h1 class="mt-1 text-2xl font-bold text-zinc-900">Transaksi</h1>
      </div>
      <p class="pb-1 text-sm font-medium text-zinc-500">
        {transactions.length} transaksi
      </p>
    </header>

    {#if transactions.length > 0}
      <div
        class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4"
        aria-label="Daftar transaksi"
      >
        {#each transactions as transaction (transaction._id)}
          <TransactionCard
            title={transaction.description}
            subtitle={`${transaction.category ?? "Lainnya"} · ${formatDate(transaction.date)}`}
            amount={`${transaction.type === "IN" ? "+" : "−"}${rupiah.format(transaction.amount)}`}
            type={transaction.type}
          />
        {/each}
      </div>
    {:else}
      <div
        class="rounded-2xl border border-zinc-200 bg-white px-5 py-10 text-center shadow-sm"
      >
        <p class="font-semibold text-zinc-900">Belum ada transaksi</p>
        <p class="mt-1 text-sm text-zinc-500">
          Transaksi terbaru akan muncul di sini.
        </p>
      </div>
    {/if}
  </section>
</main>