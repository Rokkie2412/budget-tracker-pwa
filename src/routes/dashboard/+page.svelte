<script lang="ts">
  import { onMount } from "svelte";

  import { getCategoryTranslationKey } from "@/i18n";
  import { Pagination, TransactionCard } from "@/lib/components";
  import { fetchMonthlyReport } from "@/lib/services/monthly-report";
  import { showToast } from "@/stores/toast";
  import { transactionRevision } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";
  import { ALL_CATEGORY_EMOJIS, type MonthlyReportData } from "@/types";

  import {
    deleteMonthlyTransaction,
    fetchMonthlyTransactions,
  } from "./dashboard.handlers";
  import type { Transaction, TransactionsResponse } from "./transactions/transactions.types";

  const today = new Date();
  const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  let report = $state<MonthlyReportData | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state("");
  let requestSequence = 0;
  let transactionResponse = $state<TransactionsResponse | null>(null);
  let transactionPage = $state(1);
  let transactionLoading = $state(true);
  let transactionError = $state("");
  let deletingTransactionId = $state<string | null>(null);
  let transactionRequestSequence = 0;
  let observedTransactionRevision = $transactionRevision;

  const monthLabel = new Intl.DateTimeFormat(
    $language === "id" ? "id-ID" : "en-US",
    { month: "long", year: "numeric" },
  ).format(today);
  const compactCurrency = $derived(
    new Intl.NumberFormat($language === "id" ? "id-ID" : "en-US", {
      style: "currency",
      currency: "IDR",
      notation: "compact",
      maximumFractionDigits: 1,
    }),
  );
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] ?? points[index];
      const current = points[index];
      const next = points[index + 1];
      const following = points[index + 2] ?? next;
      const lowerY = Math.min(current.y, next.y);
      const upperY = Math.max(current.y, next.y);
      const firstControlY = Math.min(
        upperY,
        Math.max(lowerY, current.y + (next.y - previous.y) / 6),
      );
      const secondControlY = Math.min(
        upperY,
        Math.max(lowerY, next.y - (following.y - current.y) / 6),
      );
      const firstControlX = current.x + (next.x - previous.x) / 6;
      const secondControlX = next.x - (following.x - current.x) / 6;

      path += ` C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${next.x} ${next.y}`;
    }
    return path;
  };
  const chartGeometry = $derived.by(() => {
    const days = report?.timeline ?? [];
    const maximum = Math.max(
      0,
      ...days.map((item) => Math.max(item.income, item.expense)),
    );
    const scale = maximum || 1;
    const xPosition = (index: number) =>
      days.length <= 1 ? 44 : 44 + (index * 306) / (days.length - 1);
    const yPosition = (amount: number) => 18 + (1 - amount / scale) * 132;
    const points = days.map((item, index) => ({
      day: item.day,
      x: xPosition(index),
      income: item.income,
      incomeY: yPosition(item.income),
      expense: item.expense,
      expenseY: yPosition(item.expense),
    }));
    const labelStep = 5;
    const labelIndices = [...new Set([
      ...Array.from({ length: Math.ceil(days.length / labelStep) }, (_, index) => index * labelStep),
      days.length - 1,
    ])]
      .filter((index) => index >= 0 && index < days.length);

    return {
      maximum,
      incomePath: createSmoothPath(points.map((point) => ({ x: point.x, y: point.incomeY }))),
      expensePath: createSmoothPath(points.map((point) => ({ x: point.x, y: point.expenseY }))),
      points,
      ticks: [maximum, maximum / 2, 0].map((value) => ({
        value,
        y: yPosition(value),
      })),
      labels: labelIndices.map((index) => ({
        day: days[index].day,
        x: xPosition(index),
      })),
    };
  });
  const transactions = $derived(transactionResponse?.data?.transactions ?? []);
  const transactionPagination = $derived(transactionResponse?.data?.pagination);

  const loadDashboard = async () => {
    const requestId = ++requestSequence;
    isLoading = true;
    errorMessage = "";

    try {
      const response = await fetchMonthlyReport(
        today.getFullYear(),
        today.getMonth() + 1,
      );
      if (requestId === requestSequence) report = response.data;
    } catch (error) {
      if (requestId === requestSequence) {
        errorMessage = error instanceof Error ? error.message : t("dashboardLoadFailed");
      }
    } finally {
      if (requestId === requestSequence) isLoading = false;
    }
  };

  const formatCurrency = (amount: number) => currency.format(amount);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  const formatAmount = (transaction: Transaction) =>
    `${transaction.type === "IN" ? "+" : "−"}${formatCurrency(transaction.amount)}`;
  const formatCategory = (category: string) =>
    t(getCategoryTranslationKey(category as keyof typeof ALL_CATEGORY_EMOJIS), $language);

  const loadTransactions = async (page = transactionPage) => {
    const requestId = ++transactionRequestSequence;
    transactionLoading = true;
    transactionError = "";

    try {
      const response = await fetchMonthlyTransactions(
        today.getFullYear(),
        today.getMonth() + 1,
        page,
      );
      if (requestId === transactionRequestSequence) {
        transactionResponse = response;
        transactionPage = response.data?.pagination?.page ?? page;
      }
    } catch (error) {
      if (requestId === transactionRequestSequence) {
        transactionError = error instanceof Error ? error.message : t("transactionsError");
      }
    } finally {
      if (requestId === transactionRequestSequence) transactionLoading = false;
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (deletingTransactionId) return;
    deletingTransactionId = transaction._id;

    try {
      await deleteMonthlyTransaction(transaction);
      const responseData = transactionResponse?.data;
      const remainingTransactions = transactions.filter(
        (item) => item._id !== transaction._id,
      );
      const totalTransactions = Math.max(
        0,
        (responseData?.pagination?.totalTransactions ?? 1) - 1,
      );
      const limit = responseData?.pagination?.limit ?? 10;
      const totalPages = Math.ceil(totalTransactions / limit);
      const targetPage = totalPages > 0 ? Math.min(transactionPage, totalPages) : 1;

      showToast(
        t("transactionDeleteSuccess", $language).replace("{title}", transaction.description),
        "success",
      );

      if (targetPage !== transactionPage && totalPages > 0) {
        await loadTransactions(targetPage);
      } else if (responseData?.pagination) {
        transactionResponse = {
          ...transactionResponse,
          data: {
            ...responseData,
            transactions: remainingTransactions,
            pagination: {
              ...responseData.pagination,
              page: targetPage,
              totalTransactions,
              totalPages,
            },
          },
        };
        transactionPage = targetPage;
      }

      try {
        const refreshedReport = await fetchMonthlyReport(
          today.getFullYear(),
          today.getMonth() + 1,
        );
        report = refreshedReport.data;
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
    void loadDashboard();
    void loadTransactions(1);
  });

  onMount(() => {
    void loadDashboard();
    void loadTransactions(1);
  });
</script>

<main
  class="mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-5 pb-4"
>
  <section class="flex min-h-0 w-full flex-1 flex-col gap-4">
    <header class="flex shrink-0 items-end justify-between gap-3 border-b border-zinc-200 bg-base-100 pb-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("transactionBookkeeping", $language)}
        </p>
        <h1 class="mt-1 text-3xl font-bold text-zinc-900">
          {t("dashboardTitle", $language)}
        </h1>
      </div>
    </header>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-6">
      {#if isLoading}
      <div class="flex min-h-64 flex-1 items-center justify-center" role="status" aria-label={t("transactionsLoading", $language)}>
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    {:else if errorMessage}
      <div class="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="alert">
        <p class="font-semibold text-red-600">{t("dashboardLoadFailed", $language)}</p>
        <p class="text-sm text-zinc-500">{errorMessage}</p>
        <button type="button" class="btn btn-sm btn-outline" onclick={() => loadDashboard()}>
          {t("dashboardRetry", $language)}
        </button>
      </div>
    {:else if report}
      <section class={`stats stats-vertical w-full overflow-hidden rounded-lg border shadow-none ${report.summary.total >= 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`} aria-label={t("reportBalance", $language)}>
        <div class="stat px-4 py-4">
          <div class={`stat-title ${report.summary.total >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
            {t("reportBalance", $language)}
          </div>
          <div class={`stat-value break-all text-3xl ${report.summary.total >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatCurrency(report.summary.total)}
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-3" aria-label={t("dashboardDescription", $language)}>
        <article class="stat min-w-0 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-3 shadow-none">
          <div class="stat-title truncate text-rose-800">{t("reportExpenses", $language)}</div>
          <div class="stat-value text-lg text-rose-700">{formatCurrency(report.summary.expense)}</div>
        </article>
        <article class="stat min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3 shadow-none">
          <div class="stat-title truncate text-emerald-800">{t("reportIncome", $language)}</div>
          <div class="stat-value text-lg text-emerald-700">{formatCurrency(report.summary.income)}</div>
        </article>
      </section>

      <section class="space-y-4 rounded-lg border border-sky-100 bg-sky-50/50 p-3 pb-4" aria-label={t("dashboardCashflowChart", $language)}>
        <div>
          <h2 class="text-base font-semibold text-sky-950">
            {t("dashboardCashflowChart", $language)}
          </h2>
          <p class="text-xs text-zinc-500">{monthLabel}</p>
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-zinc-700">
          <span class="badge badge-success badge-soft h-auto gap-2 py-1.5">
            <span class="size-2.5 rounded-full bg-emerald-600" aria-hidden="true"></span>
            {t("reportIncome", $language)}
            <span class="tabular-nums text-zinc-900">{compactCurrency.format(report.summary.income)}</span>
          </span>
          <span class="badge badge-error badge-soft h-auto gap-2 py-1.5">
            <span class="size-2.5 rounded-full bg-rose-600" aria-hidden="true"></span>
            {t("reportExpenses", $language)}
            <span class="tabular-nums text-zinc-900">{compactCurrency.format(report.summary.expense)}</span>
          </span>
        </div>

        {#if chartGeometry.maximum > 0}
          <div class="w-full overflow-hidden" role="img" aria-label={t("dashboardCashflowChart", $language)}>
            <svg viewBox="0 0 360 190" class="block aspect-[1.9/1] w-full" aria-hidden="true">
              {#each chartGeometry.ticks as tick (tick.value)}
                <line x1="44" x2="350" y1={tick.y} y2={tick.y} stroke="#e4e4e7" stroke-width="1" />
                <text x="38" y={tick.y + 3} text-anchor="end" class="fill-zinc-400 text-[8px]">
                  {compactCurrency.format(tick.value)}
                </text>
              {/each}
              <path
                d={chartGeometry.incomePath}
                fill="none"
                stroke="#10b981"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
              <path
                d={chartGeometry.expensePath}
                fill="none"
                stroke="#f87171"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
              {#each chartGeometry.points as point (point.day)}
                <circle cx={point.x} cy={point.incomeY} r="2" fill="white" stroke="#10b981" stroke-width="1.5">
                  <title>{point.day}: {t("reportIncome", $language)} {formatCurrency(point.income)}</title>
                </circle>
                <circle cx={point.x} cy={point.expenseY} r="2" fill="white" stroke="#f87171" stroke-width="1.5">
                  <title>{point.day}: {t("reportExpenses", $language)} {formatCurrency(point.expense)}</title>
                </circle>
              {/each}
              {#each chartGeometry.labels as label (label.day)}
                <text x={label.x} y="177" text-anchor="middle" class="fill-zinc-500 text-[9px]">
                  {label.day}
                </text>
              {/each}
            </svg>
          </div>
        {:else}
          <p class="py-6 text-center text-sm text-zinc-500">
            {t("dashboardNoCategoryData", $language)}
          </p>
        {/if}

        <div class="space-y-3 border-t border-sky-100 pt-3">
          <h3 class="text-sm font-semibold text-sky-950">
            {t("dashboardCategoryBreakdown", $language)}
          </h3>
          {#each [
            { title: t("reportIncome", $language), items: report.categories.income, color: "text-emerald-700" },
            { title: t("reportExpenses", $language), items: report.categories.expenses, color: "text-rose-700" },
          ] as categoryGroup (categoryGroup.title)}
            <details class={`collapse collapse-arrow rounded-md border ${categoryGroup.title === t("reportIncome", $language) ? "border-emerald-100 bg-emerald-50/50" : "border-rose-100 bg-rose-50/50"}`}>
              <summary class="collapse-title min-h-0 px-3 py-2 text-sm font-medium">
                {categoryGroup.title}
              </summary>
              <ul class="collapse-content divide-y divide-zinc-100 px-3">
                {#each categoryGroup.items as item (item.category)}
                  <li class="flex items-center justify-between gap-3 py-2 text-sm">
                    <span class="truncate text-zinc-700">
                      {ALL_CATEGORY_EMOJIS[item.category]} {formatCategory(item.category)}
                    </span>
                    <span class={`shrink-0 font-medium tabular-nums ${categoryGroup.color}`}>
                      {formatCurrency(item.total)}
                    </span>
                  </li>
                {:else}
                  <li class="py-2 text-sm text-zinc-500">
                    {t("dashboardNoCategoryData", $language)}
                  </li>
                {/each}
              </ul>
            </details>
          {/each}
        </div>
      </section>

      <section class="pb-2" aria-label={t("dashboardMonthlyTransactions", $language)}>
        <header class="mb-2 flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-zinc-900">
            {t("dashboardMonthlyTransactions", $language)}
          </h2>
          <span class="text-xs tabular-nums text-zinc-500">
            {transactionPagination?.totalTransactions ?? 0}
          </span>
        </header>

        {#if transactionLoading}
          <div class="flex min-h-32 items-center justify-center" role="status" aria-label={t("transactionsLoading", $language)}>
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>
        {:else if transactionError}
          <div class="flex flex-col items-center gap-2 py-6 text-center" role="alert">
            <p class="text-sm text-zinc-500">{transactionError}</p>
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => loadTransactions(1)}>
              {t("retry", $language)}
            </button>
          </div>
        {:else if transactions.length > 0}
          <ul class="divide-y divide-zinc-100">
            {#each transactions as transaction (transaction._id)}
              <li class="py-1">
                <TransactionCard
                  title={transaction.description}
                  date={formatDate(transaction.date)}
                  category={transaction.category}
                  amount={formatAmount(transaction)}
                  type={transaction.type}
                  onDelete={() => handleDeleteTransaction(transaction)}
                  isDeleting={deletingTransactionId === transaction._id}
                />
              </li>
            {/each}
          </ul>

          {#if transactionPagination}
            <footer class="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2">
              <p class="text-xs text-zinc-500">
                {t("paginationPageSummary", $language)
                  .replace("{page}", String(transactionPagination.page))
                  .replace("{total}", String(transactionPagination.totalPages))}
              </p>
              <Pagination
                totalPages={transactionPagination.totalPages}
                page={transactionPagination.page}
                on:pageChange={(event) => loadTransactions(event.detail)}
              />
            </footer>
          {/if}
        {:else}
          <p class="py-6 text-center text-sm text-zinc-500">
            {t("transactionsEmptyTitle", $language)}
          </p>
        {/if}
      </section>
      {/if}
    </div>
  </section>
</main>
