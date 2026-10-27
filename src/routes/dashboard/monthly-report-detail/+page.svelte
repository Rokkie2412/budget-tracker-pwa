<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { goto } from "$app/navigation";

  import { getCategoryTranslationKey } from "@/i18n";
  import { Pagination, TransactionCard } from "@/lib/components";
  import { fetchMonthlyReport } from "@/lib/services/monthly-report";
  import { transactionRevision } from "@/stores/transactions-changed";
  import { loadReportPeriod, type ReportPeriod,reportPeriod } from "@/stores/report-period";
  import { showToast } from "@/stores/toast";
  import { language, t } from "@/stores/translation";
  import { ALL_CATEGORY_EMOJIS, type MonthlyReportData } from "@/types";

  import {
    deleteMonthlyTransaction,
    fetchMonthlyTransactions,
  } from "../dashboard.handlers";
  import type { Transaction, TransactionsResponse } from "../transactions/transactions.types";

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
    const maximum = Math.max(0, ...days.map((day) => Math.max(day.income, day.expense)));
    const scale = maximum || 1;
    const x = (index: number) => days.length <= 1 ? 44 : 44 + (index * 306) / (days.length - 1);
    const y = (value: number) => 18 + (1 - value / scale) * 132;
    const labels = [...new Set([
      ...Array.from({ length: Math.ceil(days.length / 5) }, (_, index) => index * 5),
      days.length - 1,
    ])].filter((index) => index >= 0 && index < days.length);

    return {
      maximum,
      incomePoints: days.map((day, index) => `${x(index)},${y(day.income)}`).join(" "),
      expensePoints: days.map((day, index) => `${x(index)},${y(day.expense)}`).join(" "),
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
    t(getCategoryTranslationKey(category as keyof typeof ALL_CATEGORY_EMOJIS), $language);

  const loadReport = async () => {
    const requestId = ++reportRequestSequence;
    isLoading = true;
    loadError = "";
    try {
      const response = await fetchMonthlyReport(period.year, period.month);
      if (requestId === reportRequestSequence) report = response.data;
    } catch (error) {
      if (requestId === reportRequestSequence) {
        loadError = error instanceof Error ? error.message : t("reportLoadFailed", $language);
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
      const response = await fetchMonthlyTransactions(period.year, period.month, page);
      if (requestId === transactionRequestSequence) {
        transactionResponse = response;
        transactionPage = response.data?.pagination?.page ?? page;
      }
    } catch (error) {
      if (requestId === transactionRequestSequence) {
        transactionError = error instanceof Error ? error.message : t("transactionsError", $language);
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
      const remainingTransactions = transactions.filter((item) => item._id !== transaction._id);
      const totalTransactions = Math.max(0, (currentData?.pagination?.totalTransactions ?? 1) - 1);
      const limit = currentData?.pagination?.limit ?? 10;
      const totalPages = Math.ceil(totalTransactions / limit);
      const targetPage = totalPages > 0 ? Math.min(transactionPage, totalPages) : 1;

      showToast(
        t("transactionDeleteSuccess", $language).replace("{title}", transaction.description),
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
        const updatedReport = await fetchMonthlyReport(period.year, period.month);
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

<main class="mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-5 pb-4">
  <section class="flex min-h-0 w-full flex-1 flex-col gap-4">
    <header class="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-base-100 pb-4">
      <button
        type="button"
        class="btn btn-ghost btn-square btn-sm"
        aria-label={t("backToReports", $language)}
        onclick={() => goto("/dashboard/reports")}
      >
        <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <div class="min-w-0">
        <p class="truncate text-xs font-semibold uppercase text-zinc-500">{monthLabel}</p>
        <h1 class="truncate text-xl font-bold text-zinc-900">
          {t("monthlyReportDetail", $language)}
        </h1>
      </div>
    </header>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-6">
      {#if isLoading}
        <div class="flex min-h-48 items-center justify-center" role="status" aria-label={t("transactionsLoading", $language)}>
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      {:else if loadError}
        <div class="flex min-h-48 flex-col items-center justify-center gap-3 text-center" role="alert">
          <p class="font-semibold text-red-600">{t("reportLoadFailed", $language)}</p>
          <p class="text-sm text-zinc-500">{loadError}</p>
          <button type="button" class="btn btn-sm btn-outline" onclick={() => loadReport()}>
            {t("reportRetry", $language)}
          </button>
        </div>
      {:else if report}
        <section class="stats stats-vertical w-full rounded-lg border border-zinc-200 bg-white shadow-none" aria-label={t("reportBalance", $language)}>
          <div class="stat px-4 py-3">
            <div class="stat-title">{t("reportBalance", $language)}</div>
            <div class={`stat-value text-2xl ${report.summary.total >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(report.summary.total)}
            </div>
          </div>
          <div class="stat grid grid-cols-2 border-t border-zinc-100 px-4 py-3">
            <div>
              <div class="stat-title">{t("reportIncome", $language)}</div>
              <div class="stat-value text-base text-emerald-700">{formatCurrency(report.summary.income)}</div>
            </div>
            <div>
              <div class="stat-title">{t("reportExpenses", $language)}</div>
              <div class="stat-value text-base text-rose-700">{formatCurrency(report.summary.expense)}</div>
            </div>
          </div>
        </section>

        <section class="space-y-4 rounded-lg border border-sky-100 bg-sky-50/50 p-3 pb-4" aria-label={t("dashboardCashflowChart", $language)}>
          <div class="flex flex-wrap gap-3 text-xs font-medium text-zinc-700">
            <span class="badge badge-success badge-soft">{t("reportIncome", $language)} · {formatCurrency(report.summary.income)}</span>
            <span class="badge badge-error badge-soft">{t("reportExpenses", $language)} · {formatCurrency(report.summary.expense)}</span>
          </div>
          {#if chartGeometry.maximum > 0}
            <div class="w-full overflow-hidden" role="img" aria-label={t("dashboardCashflowChart", $language)}>
              <svg viewBox="0 0 360 190" class="block aspect-[1.9/1] w-full" aria-hidden="true">
                {#each chartGeometry.ticks as tick (tick.value)}
                  <line x1="44" x2="350" y1={tick.y} y2={tick.y} stroke="#e4e4e7" stroke-width="1" />
                  <text x="38" y={tick.y + 3} text-anchor="end" class="fill-zinc-400 text-[8px]">{currency.format(tick.value)}</text>
                {/each}
                <polyline points={chartGeometry.incomePoints} fill="none" stroke="#10b981" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
                <polyline points={chartGeometry.expensePoints} fill="none" stroke="#f87171" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
                {#each chartGeometry.labels as label (label.day)}
                  <text x={label.x} y="177" text-anchor="middle" class="fill-zinc-500 text-[9px]">{label.day}</text>
                {/each}
              </svg>
            </div>
          {:else}
            <p class="py-4 text-center text-sm text-zinc-500">{t("dashboardNoCategoryData", $language)}</p>
          {/if}
        </section>

        <section class="space-y-3" aria-label={t("dashboardCategoryBreakdown", $language)}>
          <h2 class="text-base font-semibold text-zinc-900">{t("dashboardCategoryBreakdown", $language)}</h2>
          {#each [
            { title: t("reportIncome", $language), items: report.categories.income, color: "text-emerald-700" },
            { title: t("reportExpenses", $language), items: report.categories.expenses, color: "text-rose-700" },
          ] as group (group.title)}
            <details class="collapse collapse-arrow rounded-md border border-zinc-200 bg-base-100">
              <summary class="collapse-title min-h-0 px-3 py-2 text-sm font-medium">{group.title}</summary>
              <ul class="collapse-content divide-y divide-zinc-100 px-3">
                {#each group.items as item (item.category)}
                  <li class="flex items-center justify-between gap-3 py-2 text-sm">
                    <span class="truncate text-zinc-700">{ALL_CATEGORY_EMOJIS[item.category]} {formatCategory(item.category)}</span>
                    <span class={`shrink-0 font-medium tabular-nums ${group.color}`}>{formatCurrency(item.total)}</span>
                  </li>
                {:else}
                  <li class="py-2 text-sm text-zinc-500">{t("dashboardNoCategoryData", $language)}</li>
                {/each}
              </ul>
            </details>
          {/each}
        </section>

        <section aria-label={t("dashboardMonthlyTransactions", $language)}>
          <header class="mb-2 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-zinc-900">{t("dashboardMonthlyTransactions", $language)}</h2>
            <span class="text-xs tabular-nums text-zinc-500">{pagination?.totalTransactions ?? 0}</span>
          </header>
          {#if transactionLoading}
            <div class="flex min-h-32 items-center justify-center" role="status" aria-label={t("transactionsLoading", $language)}>
              <span class="loading loading-spinner loading-md text-primary"></span>
            </div>
          {:else if transactionError}
            <div class="flex flex-col items-center gap-2 py-6 text-center" role="alert">
              <p class="text-sm text-zinc-500">{transactionError}</p>
              <button type="button" class="btn btn-ghost btn-sm" onclick={() => loadTransactions(1)}>{t("retry", $language)}</button>
            </div>
          {:else if transactions.length > 0}
            <ul class="divide-y divide-zinc-100">
              {#each transactions as transaction (transaction._id)}
                <li class="py-1">
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
              <footer class="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2">
                <p class="text-xs text-zinc-500">
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
            <p class="py-6 text-center text-sm text-zinc-500">{t("transactionsEmptyTitle", $language)}</p>
          {/if}
        </section>
      {/if}
    </div>
  </section>
</main>