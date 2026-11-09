<script lang="ts">
  import { onMount } from "svelte";

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
  import type { TransactionsResponse } from "./transactions.types";

  let filters = $state<TransactionFiltersState>({
    type: "all",
    category: "all",
    period: "all",
    startDate: "",
    endDate: "",
  });
  let transactionResponse = $state<TransactionsResponse>({
    data: {
      transactions: [],
      pagination: {
        page: 1,
        limit: 10,
        totalTransactions: 0,
        totalPages: 0,
      },
    },
  });
  let currentPage = $state(1);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);
  let searchQuery = $state("");
  let debouncedSearchQuery = $state("");
  let deletingTransactionId = $state<string | null>(null);
  let observedTransactionRevision = $transactionRevision;
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  const transactions = $derived(transactionResponse.data?.transactions ?? []);
  const pagination = $derived(transactionResponse.data?.pagination);
  const visibleTransactions = $derived.by(() => {
    if (!debouncedSearchQuery) return transactions;

    return transactions.filter((transaction) =>
      `${transaction.description} ${transaction.category ?? ""}`
        .toLocaleLowerCase()
        .includes(debouncedSearchQuery),
    );
  });

  function handleSearchInput(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    searchQuery = input.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      debouncedSearchQuery = searchQuery.trim().toLocaleLowerCase();
    }, 250);
  }

  function clearSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = undefined;
    searchQuery = "";
    debouncedSearchQuery = "";
  }

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

  onMount(() => {
    void fetchTransactions(1);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  });

  $effect(() => {
    const revision = $transactionRevision;
    if (revision === observedTransactionRevision) return;

    observedTransactionRevision = revision;
    void fetchTransactions(1);
  });
</script>

<main
  class="motion-page mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3"
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
          >{debouncedSearchQuery
            ? visibleTransactions.length
            : (pagination?.totalTransactions ?? transactions.length)}</span
        >
        {debouncedSearchQuery
          ? t("transactionSearchMatches", $language)
          : t("transactionCount", $language)}
      </p>
    </header>

    <TransactionFilters
      {filters}
      hasExternalFilter={Boolean(searchQuery.trim() || debouncedSearchQuery)}
      onClear={clearSearch}
      onChange={handleFiltersChange}
    />

    <label class="relative block shrink-0">
      <span class="sr-only">{t("transactionSearchLabel", $language)}</span>
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        class="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        type="search"
        autocomplete="off"
        value={searchQuery}
        oninput={handleSearchInput}
        placeholder={t("transactionSearchPlaceholder", $language)}
      />
    </label>

    {#if isLoading}
      <div
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        role="status"
        aria-label={t("transactionsLoading", $language)}
      >
        <div class="min-h-0 flex-1 space-y-1 overflow-hidden px-3" aria-hidden="true">
          {#each [0, 1, 2, 3, 4] as row (row)}
            <div class="flex items-center gap-3 border-b border-zinc-200 py-3 dark:border-zinc-700">
              <span class="motion-skeleton size-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"></span>
              <span class="flex-1 space-y-2">
                <span class="motion-skeleton block h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                <span class="motion-skeleton block h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              </span>
              <span class="motion-skeleton h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
          {/each}
        </div>
        <div class="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" aria-hidden="true">
          <span class="motion-skeleton h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></span>
          <span class="motion-skeleton h-9 w-28 rounded-md bg-zinc-200 dark:bg-zinc-700"></span>
        </div>
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
    {:else if visibleTransactions.length > 0}
      <div
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3"
          aria-label={t("transactionsTitle", $language)}
        >
          {#each visibleTransactions as transaction, index (transaction._id)}
            <div
              class={`motion-list-item ${index === visibleTransactions.length - 1
                ? ""
                : "border-b border-zinc-200 dark:border-zinc-700"}`}
              style={`--motion-index: ${Math.min(index, 8)}`}
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
    {:else if debouncedSearchQuery}
      <div
        class="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900"
      >
        <p class="font-semibold text-zinc-900 dark:text-zinc-100">
          {t("transactionSearchNoMatches", $language)}
        </p>
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
