<script lang="ts">
  import { Pagination, TransactionCard } from "@/lib/components";

  import type { Props } from "./transactions.types";

  let { data }: Props = $props();

  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };
</script>

{#await data.transactions}
  <div class="flex h-screen w-full items-center justify-center">
    <div class="loading loading-spinner loading-lg text-primary"></div>
  </div>
{:then result}
  {@const transactions = result?.data?.transactions ?? []}
  {console.log("result", result)}

  <main
    data-theme="light"
    class="flex h-[calc(100dvh)] min-h-0 flex-col overflow-hidden px-4 pt-6 pb-18 sm:px-6"
  >
    <section class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-5">
      <header class="flex shrink-0 items-end justify-between gap-3">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
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
          class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4 border rounded-md border-zinc-200 p-2"
          aria-label="Daftar transaksi"
        >
          {#each transactions as transaction (transaction._id)}
            <div
              class={`border-b-2 ${transaction === transactions[transactions.length - 1] ? "border-none" : "border-zinc-200"}`}
            >
              <TransactionCard
                onDelete={() => console.log(transaction)}
                title={transaction.description}
                date={formatDate(transaction.date)}
                category={transaction.category}
                amount={`${transaction.type === "IN" ? "+" : "−"}${rupiah.format(transaction.amount)}`}
                type={transaction.type}
              />
            </div>
          {/each}

          <Pagination
            totalPages={result.data.pagination.totalPages}
            page={result.data.pagination.page}
            on:pageChange={() => {}}
          />
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
{:catch error}
  <!-- State 3: Error handling -->
  <div
    class="flex h-screen w-full flex-col items-center justify-center gap-2 text-center"
  >
    <p class="font-semibold text-red-500">Gagal memuat data transaksi</p>
    <p class="text-sm text-zinc-500">
      {error?.message ?? "Terjadi kesalahan sistem"}
    </p>
  </div>
{/await}
