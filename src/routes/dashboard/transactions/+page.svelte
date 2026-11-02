<script lang="ts">
  import {
    Pagination,
    TransactionCard,
    TransactionFilters,
  } from "@/lib/components";
  import type { TransactionFiltersState } from "@/lib/components/transaction-filters/transaction-filters.types";
  import { transactionRevision } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";

  import {
    createTransactionHandlers,
    formatTransactionAmount,
    formatTransactionDate,
  } from "./transactions.handlers";
  import type { Props } from "./transactions.types";

  let { data }: Props = $props();
  let filters = $state<TransactionFiltersState>({
    type: "all",
    category: "all",
    period: "all",
    startDate: "",
    endDate: "",
  });
  let transactionResponse = $state(data.transactions);
  let currentPage = $state(data.transactions.data?.pagination?.page ?? 1);
  let isLoading = $state(false);
  let loadError = $state<string | null>(
    data.errorMessage ?? data.transactions.errorMessage ?? null,
  );
  let deletingTransactionId = $state<string | null>(null);
  let observedTransactionRevision = $transactionRevision;
  const transactions = $derived(transactionResponse.data?.transactions ?? []);
  const pagination = $derived(transactionResponse.data?.pagination);

  const {
    deleteTransaction,
    fetchTransactions,
    handleFiltersChange,
    handlePageChange,
  } = createTransactionHandlers({
    getFilters: () => filters,
    getCurrentPage: () => currentPage,
    getTransactions: () => transactions,
    getResponse: () => transactionResponse,
    getPagination: () => pagination,
    getDeletingTransactionId: () => deletingTransactionId,
    setFilters: (value) => (filters = value),
    setResponse: (value) => (transactionResponse = value),
    setCurrentPage: (value) => (currentPage = value),
    setLoading: (value) => (isLoading = value),
    setLoadError: (value) => (loadError = value),
    setDeletingTransactionId: (value) => (deletingTransactionId = value),
  });

  $effect(() => {
    const revision = $transactionRevision;
    if (revision === observedTransactionRevision) return;

    observedTransactionRevision = revision;
    void fetchTransactions(1);
  });
</script>

<main
  class="mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-4 pb-3"
>
  <section class="flex min-h-0 w-full flex-1 flex-col gap-3">
    <header
      class="flex shrink-0 items-end justify-between gap-3 border-b border-zinc-200 dark:border-zinc-700 pb-4"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("transactionBookkeeping", $language)}
        </p>
        <h1 class="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("transactionsTitle", $language)}
        </h1>
      </div>
      <p class="pb-1 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <span class="block text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100"
          >{pagination?.totalTransactions ?? transactions.length}</span
        >
        {t("transactionCount", $language)}
      </p>
    </header>

    <TransactionFilters {filters} onChange={handleFiltersChange} />

    {#if isLoading}
      <div
        class="flex min-h-0 flex-1 items-center justify-center"
        role="status"
        aria-label={t("transactionsLoading", $language)}
      >
        <span class="size-8 animate-spin rounded-full border-2 border-emerald-700 border-r-transparent" aria-hidden="true"></span>
      </div>
    {:else if loadError}
      <div
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center"
      >
        <p class="font-semibold text-red-600">
          {t("transactionsError", $language)}
        </p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">{loadError}</p>
        <button
          type="button"
          class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          onclick={() => fetchTransactions(1)}
        >
          {t("retry", $language)}
        </button>
      </div>
    {:else if transactions.length > 0}
      <div
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3"
          aria-label={t("transactionsTitle", $language)}
        >
          {#each transactions as transaction, index (transaction._id)}
            <div
              class={index === transactions.length - 1
                ? ""
                : "border-b border-zinc-200 dark:border-zinc-700"}
            >
              <TransactionCard
                onDelete={() => deleteTransaction(transaction)}
                isDeleting={deletingTransactionId === transaction._id}
                title={transaction.description}
                date={formatTransactionDate(
                  transaction.date,
                  $language === "id" ? "id-ID" : "en-US",
                )}
                category={transaction.category}
                amount={formatTransactionAmount(
                  transaction.amount,
                  transaction.type,
                )}
                type={transaction.type}
              />
            </div>
          {/each}
        </div>

        {#if pagination}
          <footer
            class="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("paginationPageSummary", $language)
                .replace("{page}", String(pagination.page))
                .replace("{total}", String(pagination.totalPages))}
            </p>
            <Pagination
              totalPages={pagination.totalPages}
              page={pagination.page}
              on:pageChange={handlePageChange}
            />
          </footer>
        {/if}
      </div>
    {:else}
      <div
        class="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900"
      >
        <p class="font-semibold text-zinc-900 dark:text-zinc-100">
          {t("transactionsEmptyTitle", $language)}
        </p>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("transactionsEmptyDescription", $language)}
        </p>
      </div>
    {/if}
  </section>
</main>
