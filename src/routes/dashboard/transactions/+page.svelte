<script lang="ts">
  import { Pagination, TransactionCard, TransactionFilters } from "@/lib/components";
  import type { TransactionFiltersState } from "@/lib/components/transaction-filters/transaction-filters.types";
  import { checkAuth } from "@/lib/services/auth";
  import { apiBaseUrl } from "@/lib/utils";
  import { language, t } from "@/stores/translation";

  import type { TransactionsResponse } from "./transactions.types";
  import type { Props } from "./transactions.types";

  let { data }: Props = $props();
  let filters = $state<TransactionFiltersState>({
    type: "all",
    category: "all",
    period: "all",
    startDate: "",
    endDate: "",
  });
  let transactionResponse = $state<TransactionsResponse>(data.transactions);
  let currentPage = $state(data.transactions.data?.pagination?.page ?? 1);
  let isLoading = $state(false);
  let loadError = $state<string | null>(
    data.errorMessage ?? data.transactions.errorMessage ?? null,
  );
  let requestSequence = 0;
  const transactions = $derived(transactionResponse.data?.transactions ?? []);
  const pagination = $derived(transactionResponse.data?.pagination);

  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };

  const fetchTransactions = async (
    targetPage: number,
    selectedFilters: TransactionFiltersState = filters,
  ) => {
    const requestId = ++requestSequence;
    isLoading = true;
    loadError = null;

    try {
      const authData = await checkAuth();
      if (!authData) throw new Error(t("invalidCredentials", $language));

      const params = new URLSearchParams({
        userId: authData.phoneNumber,
        page: String(targetPage),
      });
      if (selectedFilters.type !== "all") params.set("type", selectedFilters.type);
      if (selectedFilters.category !== "all") {
        params.set("category", selectedFilters.category);
      }
      if (selectedFilters.startDate && selectedFilters.endDate) {
        params.set("startDate", selectedFilters.startDate);
        params.set("endDate", selectedFilters.endDate);
      }

      const response = await fetch(`${apiBaseUrl}/api/transactions-list?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.jwtToken}`,
        },
      });
      const result = (await response.json()) as TransactionsResponse;

      if (!response.ok) {
        throw new Error(result.errorMessage ?? `${t("transactionsError", $language)} (${response.status})`);
      }
      if (requestId !== requestSequence) return;

      transactionResponse = result;
      currentPage = result.data?.pagination?.page ?? targetPage;
    } catch (error) {
      if (requestId === requestSequence) {
        loadError = error instanceof Error ? error.message : t("transactionsError", $language);
      }
    } finally {
      if (requestId === requestSequence) isLoading = false;
    }
  };

  const nextPage = () => {
    if (currentPage < (pagination?.totalPages ?? 0)) {
      void fetchTransactions(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) void fetchTransactions(currentPage - 1);
  };

  const handlePageChange = (event: CustomEvent<number>) => {
    if (event.detail > currentPage) nextPage();
    else previousPage();
  };

  const handleFiltersChange = (nextFilters: TransactionFiltersState) => {
    filters = nextFilters;
    currentPage = 1;
    void fetchTransactions(1, nextFilters);
  };
</script>

  <main
    data-theme="light"
    class="mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-4 pb-3"
  >
    <section class="flex min-h-0 w-full flex-1 flex-col gap-3">
      <header class="flex shrink-0 items-end justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            {t("transactionBookkeeping", $language)}
          </p>
          <h1 class="mt-1 text-3xl font-bold text-zinc-900">{t("transactionsTitle", $language)}</h1>
        </div>
        <p class="pb-1 text-right text-sm font-medium text-zinc-500">
          <span class="block text-lg font-bold tabular-nums text-zinc-900">{pagination?.totalTransactions ?? transactions.length}</span>
          {t("transactionCount", $language)}
        </p>
      </header>

      <TransactionFilters filters={filters} onChange={handleFiltersChange} />

      {#if isLoading}
        <div
          class="flex min-h-0 flex-1 items-center justify-center"
          role="status"
          aria-label={t("transactionsLoading", $language)}
        >
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      {:else if loadError}
        <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
          <p class="font-semibold text-red-600">{t("transactionsError", $language)}</p>
          <p class="text-sm text-zinc-500">{loadError}</p>
          <button type="button" class="btn btn-sm btn-outline" onclick={() => fetchTransactions(1)}>
            {t("retry", $language)}
          </button>
        </div>
      {:else if transactions.length > 0}
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3" aria-label={t("transactionsTitle", $language)}>
            {#each transactions as transaction, index (transaction._id)}
              <div class={index === transactions.length - 1 ? "" : "border-b border-zinc-200"}>
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
          </div>

          {#if pagination}
            <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
              <p class="text-xs font-medium text-zinc-500">
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
          class="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center"
        >
          <p class="font-semibold text-zinc-900">{t("transactionsEmptyTitle", $language)}</p>
          <p class="mt-1 text-sm text-zinc-500">
            {t("transactionsEmptyDescription", $language)}
          </p>
        </div>
      {/if}
    </section>
  </main>
