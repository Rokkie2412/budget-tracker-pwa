<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { get } from "svelte/store";

  import { goto } from "$app/navigation";

  import { getCategoryTranslationKey } from "@/i18n";
  import { Pagination, TransactionCard } from "@/lib/components";
  import { fetchMonthlyReport } from "@/lib/services/monthly-report";
  import {
    loadReportPeriod,
    type ReportPeriod,
    reportPeriod,
  } from "@/stores/report-period";
  import { showToast } from "@/stores/toast";
  import { transactionRevision } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";
  import { ALL_CATEGORY_EMOJIS, type MonthlyReportData } from "@/types";

  import {
    deleteMonthlyTransaction,
    fetchMonthlyTransactions,
  } from "../dashboard.handlers";
  import type {
    Transaction,
    TransactionsResponse,
  } from "../transactions/transactions.types";

  const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
  let period = $state<ReportPeriod>(get(reportPeriod));
  let report = $state<MonthlyReportData | null>(null);
  let transactionResponse = $state<TransactionsResponse | null>(null);
  let transactionPage = $state(1);
  let isLoading = $state(true);
  let transactionLoading = $state(true);
  let loadError = $state("");
  let transactionError = $state("");
  let deletingTransactionId = $state<string | null>(null);
  let expandedCategoryGroups = $state<Record<string, boolean>>({});
  let reportRequestSequence = 0;
  let transactionRequestSequence = 0;
  let observedTransactionRevision = $transactionRevision;

  const monthLabel = $derived(
    new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(period.year, period.month - 1, 1)),
  );
  const transactions = $derived(transactionResponse?.data?.transactions ?? []);
  const pagination = $derived(transactionResponse?.data?.pagination);
  const chartGeometry = $derived.by(() => {
    const days = report?.timeline ?? [];
    const maximum = Math.max(
      0,
      ...days.map((day) => Math.max(day.income, day.expense)),
    );
    const scale = maximum || 1;
    const x = (index: number) =>
      days.length <= 1 ? 44 : 44 + (index * 306) / (days.length - 1);
    const y = (value: number) => 18 + (1 - value / scale) * 132;
    const labels = [
      ...new Set([
        ...Array.from(
          { length: Math.ceil(days.length / 5) },
          (_, index) => index * 5,
        ),
        days.length - 1,
      ]),
    ].filter((index) => index >= 0 && index < days.length);

    return {
      maximum,
      incomePoints: days
        .map((day, index) => `${x(index)},${y(day.income)}`)
        .join(" "),
      expensePoints: days
        .map((day, index) => `${x(index)},${y(day.expense)}`)
        .join(" "),
      ticks: [maximum, maximum / 2, 0].map((value) => ({ value, y: y(value) })),
      labels: labels.map((index) => ({ day: days[index].day, x: x(index) })),
    };
  });

  const formatCurrency = (amount: number) => currency.format(amount);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  const formatCategory = (category: string) =>
    t(
      getCategoryTranslationKey(category as keyof typeof ALL_CATEGORY_EMOJIS),
      $language,
    );

  const loadReport = async () => {
    const requestId = ++reportRequestSequence;
    isLoading = true;
    loadError = "";
    try {
      const response = await fetchMonthlyReport(period.year, period.month);
      if (requestId === reportRequestSequence) report = response.data;
    } catch (error) {
      if (requestId === reportRequestSequence) {
        loadError =
          error instanceof Error
            ? error.message
            : t("reportLoadFailed", $language);
      }
    } finally {
      if (requestId === reportRequestSequence) isLoading = false;
    }
  };

  const loadTransactions = async (page = transactionPage) => {
    const requestId = ++transactionRequestSequence;
    transactionLoading = true;
    transactionError = "";
    try {
      const response = await fetchMonthlyTransactions(
        period.year,
        period.month,
        page,
      );
      if (requestId === transactionRequestSequence) {
        transactionResponse = response;
        transactionPage = response.data?.pagination?.page ?? page;
      }
    } catch (error) {
      if (requestId === transactionRequestSequence) {
        transactionError =
          error instanceof Error
            ? error.message
            : t("transactionsError", $language);
      }
    } finally {
      if (requestId === transactionRequestSequence) transactionLoading = false;
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (deletingTransactionId) return;
    deletingTransactionId = transaction._id;
    try {
      await deleteMonthlyTransaction(transaction);
      const currentData = transactionResponse?.data;
      const remainingTransactions = transactions.filter(
        (item) => item._id !== transaction._id,
      );
      const totalTransactions = Math.max(
        0,
        (currentData?.pagination?.totalTransactions ?? 1) - 1,
      );
      const limit = currentData?.pagination?.limit ?? 10;
      const totalPages = Math.ceil(totalTransactions / limit);
      const targetPage =
        totalPages > 0 ? Math.min(transactionPage, totalPages) : 1;

      showToast(
        t("transactionDeleteSuccess", $language).replace(
          "{title}",
          transaction.description,
        ),
        "success",
      );

      if (targetPage !== transactionPage && totalPages > 0) {
        await loadTransactions(targetPage);
      } else if (currentData?.pagination) {
        transactionResponse = {
          ...transactionResponse,
          data: {
            ...currentData,
            transactions: remainingTransactions,
            pagination: {
              ...currentData.pagination,
              page: targetPage,
              totalTransactions,
              totalPages,
            },
          },
        };
        transactionPage = targetPage;
      }

      try {
        const updatedReport = await fetchMonthlyReport(
          period.year,
          period.month,
        );
        report = updatedReport.data;
      } catch {
        // Keep the successful delete state visible if refreshing the summary fails.
      }
    } catch {
      showToast(t("transactionDeleteFailed", $language), "error");
    } finally {
      deletingTransactionId = null;
    }
  };

  $effect(() => {
    const revision = $transactionRevision;
    if (revision === observedTransactionRevision) return;

    observedTransactionRevision = revision;
    void loadReport();
    void loadTransactions(1);
  });

  onMount(() => {
    loadReportPeriod();
    period = get(reportPeriod);
    void loadReport();
    void loadTransactions(1);
  });
</script>

<main
  class="motion-page mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-5 pb-4"
>
  <section class="flex min-h-0 w-full flex-1 flex-col gap-4">
    <header
      class="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white pb-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label={t("backToReports", $language)}
        onclick={() => goto("/dashboard/reports")}
      >
        <svg
          aria-hidden="true"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <div class="min-w-0">
        <p class="truncate text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          {monthLabel}
        </p>
        <h1 class="truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("monthlyReportDetail", $language)}
        </h1>
      </div>
    </header>

    <div
      class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-6"
    >
      {#if isLoading}
        <div
          class="space-y-5"
          role="status"
          aria-label={t("transactionsLoading", $language)}
        >
          <section class="motion-card space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" aria-hidden="true">
            <span class="motion-skeleton block h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            <span class="motion-skeleton block h-7 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            <div class="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-700">
              <span class="motion-skeleton h-12 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              <span class="motion-skeleton h-12 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
          </section>
          <section class="motion-card space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" aria-hidden="true">
            <span class="motion-skeleton block h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            <span class="motion-skeleton block aspect-[1.9/1] w-full rounded-lg bg-zinc-200 dark:bg-zinc-700"></span>
          </section>
          <section class="motion-card space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" aria-hidden="true">
            <span class="motion-skeleton block h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            <span class="motion-skeleton block h-10 w-full rounded-md bg-zinc-200 dark:bg-zinc-700"></span>
            <span class="motion-skeleton block h-10 w-full rounded-md bg-zinc-200 dark:bg-zinc-700"></span>
          </section>
        </div>
      {:else if loadError}
        <div
          class="flex min-h-48 flex-col items-center justify-center gap-3 text-center"
          role="alert"
        >
          <p class="font-semibold text-red-600">
            {t("reportLoadFailed", $language)}
          </p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{loadError}</p>
          <button
            type="button"
            class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onclick={() => loadReport()}
          >
            {t("reportRetry", $language)}
          </button>
        </div>
      {:else if report}
        <section
          class="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          aria-label={t("reportBalance", $language)}
        >
          <div class="px-4 py-3">
            <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportBalance", $language)}</div>
            <div
              class={`text-2xl font-bold ${report.summary.total >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
            >
              {formatCurrency(report.summary.total)}
            </div>
          </div>
          <div class="grid grid-cols-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
            <div>
              <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportIncome", $language)}</div>
              <div class="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(report.summary.income)}
              </div>
            </div>
            <div>
              <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportExpenses", $language)}</div>
              <div class="text-base font-bold text-rose-700 dark:text-rose-300">
                {formatCurrency(report.summary.expense)}
              </div>
            </div>
          </div>
        </section>

        <section
          class="space-y-4 rounded-lg border border-sky-100 dark:border-sky-800 bg-sky-50/50 p-3 pb-4 dark:border-sky-900 dark:bg-sky-950/50"
          aria-label={t("dashboardCashflowChart", $language)}
        >
          <div class="flex flex-wrap gap-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span class="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              >{t("reportIncome", $language)} · {formatCurrency(
                report.summary.income,
              )}</span
            >
            <span class="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-900 dark:bg-rose-950 dark:text-rose-100"
              >{t("reportExpenses", $language)} · {formatCurrency(
                report.summary.expense,
              )}</span
            >
          </div>
          {#if chartGeometry.maximum > 0}
            <div
              class="w-full overflow-hidden"
              role="img"
              aria-label={t("dashboardCashflowChart", $language)}
            >
              <svg
                viewBox="0 0 360 190"
                class="block aspect-[1.9/1] w-full"
                aria-hidden="true"
              >
                {#each chartGeometry.ticks as tick (tick.value)}
                  <line
                    x1="44"
                    x2="350"
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#e4e4e7"
                    stroke-width="1"
                  />
                  <text
                    x="38"
                    y={tick.y + 3}
                    text-anchor="end"
                    class="fill-zinc-400 text-[8px]"
                    >{currency.format(tick.value)}</text
                  >
                {/each}
                <polyline
                  points={chartGeometry.incomePoints}
                  pathLength="1"
                  class="motion-chart-line"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points={chartGeometry.expensePoints}
                  pathLength="1"
                  class="motion-chart-line motion-chart-line-expense"
                  fill="none"
                  stroke="#f87171"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                {#each chartGeometry.labels as label (label.day)}
                  <text
                    x={label.x}
                    y="177"
                    text-anchor="middle"
                    class="fill-zinc-500 text-[9px]">{label.day}</text
                  >
                {/each}
              </svg>
            </div>
          {:else}
            <p class="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("dashboardNoCategoryData", $language)}
            </p>
          {/if}
        </section>

        <section
          class="space-y-3"
          aria-label={t("dashboardCategoryBreakdown", $language)}
        >
          <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("dashboardCategoryBreakdown", $language)}
          </h2>
          {#each [{ key: "income", title: t("reportIncome", $language), items: report.categories.income, color: "text-emerald-700 dark:text-emerald-300" }, { key: "expenses", title: t("reportExpenses", $language), items: report.categories.expenses, color: "text-rose-700 dark:text-rose-300" }] as group (group.key)}
            <div
              class="rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            >
              <button
                type="button"
                class="motion-tap flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium"
                aria-expanded={expandedCategoryGroups[group.key] ?? false}
                aria-controls={`monthly-category-${group.key}`}
                onclick={() => {
                  expandedCategoryGroups[group.key] =
                    !expandedCategoryGroups[group.key];
                }}
              >
                {group.title}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class:expanded={expandedCategoryGroups[group.key]}
                  class="category-breakdown-chevron size-4 shrink-0"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </button>
              {#if expandedCategoryGroups[group.key]}
              <ul
                id={`monthly-category-${group.key}`}
                class="divide-y divide-zinc-100 px-3 dark:divide-zinc-700"
                transition:slide={{ duration: 220 }}
              >
                {#each group.items as item (item.category)}
                  <li
                    class="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span class="truncate text-zinc-700 dark:text-zinc-300"
                      >{ALL_CATEGORY_EMOJIS[item.category]}
                      {formatCategory(item.category)}</span
                    >
                    <span
                      class={`shrink-0 font-medium tabular-nums ${group.color}`}
                      >{formatCurrency(item.total)}</span
                    >
                  </li>
                {:else}
                  <li class="py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t("dashboardNoCategoryData", $language)}
                  </li>
                {/each}
              </ul>
              {/if}
            </div>
          {/each}
        </section>

        <section aria-label={t("dashboardMonthlyTransactions", $language)}>
          <header class="mb-2 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("dashboardMonthlyTransactions", $language)}
            </h2>
            <span class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
              >{pagination?.totalTransactions ?? 0}</span
            >
          </header>
          {#if transactionLoading}
            <div
              class="space-y-2 py-2"
              role="status"
              aria-label={t("transactionsLoading", $language)}
            >
              {#each [0, 1, 2] as row (row)}
                <div class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700" aria-hidden="true">
                  <span class="motion-skeleton size-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"></span>
                  <span class="flex-1 space-y-2">
                    <span class="motion-skeleton block h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                    <span class="motion-skeleton block h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                  </span>
                  <span class="motion-skeleton h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                </div>
              {/each}
            </div>
          {:else if transactionError}
            <div
              class="flex flex-col items-center gap-2 py-6 text-center"
              role="alert"
            >
              <p class="text-sm text-zinc-500 dark:text-zinc-400">{transactionError}</p>
              <button
                type="button"
                class="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onclick={() => loadTransactions(1)}
                >{t("retry", $language)}</button
              >
            </div>
          {:else if transactions.length > 0}
            <ul class="divide-y divide-zinc-100 dark:divide-zinc-700">
              {#each transactions as transaction, index (transaction._id)}
                <li
                  class="motion-list-item py-1"
                  style={`--motion-index: ${Math.min(index, 8)}`}
                >
                  <TransactionCard
                    title={transaction.description}
                    date={formatDate(transaction.date)}
                    category={transaction.category}
                    amount={`${transaction.type === "IN" ? "+" : "−"}${formatCurrency(transaction.amount)}`}
                    type={transaction.type}
                    onDelete={() => handleDelete(transaction)}
                    isDeleting={deletingTransactionId === transaction._id}
                  />
                </li>
              {/each}
            </ul>
            {#if pagination}
              <footer
                class="mt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2"
              >
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("paginationPageSummary", $language)
                    .replace("{page}", String(pagination.page))
                    .replace("{total}", String(pagination.totalPages))}
                </p>
                <Pagination
                  totalPages={pagination.totalPages}
                  page={pagination.page}
                  on:pageChange={(event) => loadTransactions(event.detail)}
                />
              </footer>
            {/if}
          {:else}
            <p class="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("transactionsEmptyTitle", $language)}
            </p>
          {/if}
        </section>
      {/if}
    </div>
  </section>
</main>
