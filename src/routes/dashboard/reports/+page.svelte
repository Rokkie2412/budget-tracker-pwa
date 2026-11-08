<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { goto } from "$app/navigation";

  import { getCategoryTranslationKey } from "@/i18n";
  import { fetchMonthlyReport } from "@/lib/services/monthly-report";
  import { loadReportPeriod, reportPeriod, setReportPeriod } from "@/stores/report-period";
  import { transactionRevision } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";
  import { ALL_CATEGORY_EMOJIS, type MonthlyReportData } from "@/types";

  const today = new Date();
  const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  let year = $derived($reportPeriod.year);
  let month = $derived($reportPeriod.month);
  let report = $state<MonthlyReportData | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state("");
  let requestSequence = 0;
  let observedTransactionRevision = $transactionRevision;

  const monthDate = $derived(new Date(year, month - 1, 1));
  const monthLabel = $derived(
    new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(monthDate),
  );
  const monthOptions = $derived(
    Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      label: new Intl.DateTimeFormat($language === "id" ? "id-ID" : "en-US", {
        month: "long",
      }).format(new Date(2024, index, 1)),
    })),
  );
  const yearOptions = Array.from(
    { length: today.getFullYear() - 1999 },
    (_, index) => today.getFullYear() - index,
  );

  const loadReport = async (targetYear = year, targetMonth = month) => {
    const requestId = ++requestSequence;
    isLoading = true;
    errorMessage = "";

    try {
      const response = await fetchMonthlyReport(targetYear, targetMonth);
      if (requestId === requestSequence) report = response.data;
    } catch (error) {
      if (requestId === requestSequence) {
        errorMessage = error instanceof Error ? error.message : t("reportLoadFailed");
      }
    } finally {
      if (requestId === requestSequence) isLoading = false;
    }
  };

  const changePeriod = (targetYear: number, targetMonth: number) => {
    setReportPeriod({ year: targetYear, month: targetMonth });
    void loadReport(targetYear, targetMonth);
  };

  $effect(() => {
    const revision = $transactionRevision;
    if (revision === observedTransactionRevision) return;

    observedTransactionRevision = revision;
    void loadReport();
  });

  const formatCurrency = (amount: number) => currency.format(amount);
  const formatCategory = (category: string) =>
    t(getCategoryTranslationKey(category as keyof typeof ALL_CATEGORY_EMOJIS), $language);

  onMount(() => {
    loadReportPeriod();
    const period = get(reportPeriod);
    void loadReport(period.year, period.month);
  });
</script>

<main
  class="motion-page mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-5 pb-4"
>
  <section class="flex min-h-0 w-full flex-1 flex-col gap-4">
    <header class="shrink-0 border-b border-zinc-200 dark:border-zinc-700 pb-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("transactionBookkeeping", $language)}
      </p>
      <h1 class="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {t("reportsTitle", $language)}
      </h1>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {t("reportsDescription", $language)}
      </p>
    </header>

    <div class="grid shrink-0 grid-cols-[1fr_auto] gap-2" aria-label={t("reportsTitle", $language)}>
      <label class="sr-only" for="report-month">{t("reportMonth", $language)}</label>
      <select
        id="report-month"
        class="h-11 min-w-0 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={month}
        disabled={isLoading}
        onchange={(event) => changePeriod(year, Number(event.currentTarget.value))}
      >
        {#each monthOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <label class="sr-only" for="report-year">{t("reportYear", $language)}</label>
      <select
        id="report-year"
        class="h-11 w-28 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={year}
        disabled={isLoading}
        onchange={(event) => changePeriod(Number(event.currentTarget.value), month)}
      >
        {#each yearOptions as yearOption (yearOption)}
          <option value={yearOption}>{yearOption}</option>
        {/each}
      </select>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-label={monthLabel}>
      {#if isLoading}
        <div class="space-y-5 py-1" role="status" aria-label={t("transactionsLoading", $language)}>
          <section class="motion-card overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" aria-hidden="true">
            <div class="space-y-3 px-4 py-3">
              <span class="motion-skeleton block h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              <span class="motion-skeleton block h-7 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
            <div class="space-y-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
              <span class="motion-skeleton block h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              <span class="motion-skeleton block h-5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
            <div class="space-y-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
              <span class="motion-skeleton block h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              <span class="motion-skeleton block h-5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            </div>
          </section>
          <span class="motion-skeleton block h-12 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></span>
          <section class="motion-card space-y-3" aria-hidden="true">
            <span class="motion-skeleton mb-3 block h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-700"></span>
            {#each [0, 1, 2] as row (row)}
              <div class="flex items-center justify-between gap-3 border-b border-zinc-100 py-3 dark:border-zinc-700">
                <span class="motion-skeleton h-4 w-2/5 rounded bg-zinc-200 dark:bg-zinc-700"></span>
                <span class="motion-skeleton h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700"></span>
              </div>
            {/each}
          </section>
        </div>
      {:else if errorMessage}
        <div class="flex min-h-48 flex-col items-center justify-center gap-3 text-center" role="alert">
          <p class="font-semibold text-red-600">{t("reportLoadFailed", $language)}</p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
          <button type="button" class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800" onclick={() => loadReport()}>
            {t("reportRetry", $language)}
          </button>
        </div>
      {:else if report}
        <section class="motion-card motion-lift mb-5 w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" aria-label={t("reportsTitle", $language)}>
        <div class="px-4 py-3">
          <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportBalance", $language)}</div>
          <div class={`text-2xl font-bold ${report.summary.total >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {formatCurrency(report.summary.total)}
          </div>
        </div>
        <div class="border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
          <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportIncome", $language)}</div>
          <div class="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(report.summary.income)}
          </div>
        </div>
        <div class="border-t border-zinc-100 px-4 py-3 dark:border-zinc-700">
          <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("reportExpenses", $language)}</div>
          <div class="text-xl font-bold text-rose-700 dark:text-rose-300">
            {formatCurrency(report.summary.expense)}
          </div>
        </div>
        </section>

        <button
          type="button"
          class="motion-tap mb-5 flex w-full items-center justify-between rounded-lg border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950"
          onclick={() => goto("/dashboard/monthly-report-detail")}
        >
          {t("viewReportDetails", $language)}
          <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </button>

        <section class="space-y-5" aria-label={t("reportsTitle", $language)}>
          {#each [
          {
            title: t("reportIncomeBreakdown", $language),
            empty: t("reportNoIncome", $language),
            items: report.categories.income,
            tone: "success",
          },
          {
            title: t("reportExpenseBreakdown", $language),
            empty: t("reportNoExpenses", $language),
            items: report.categories.expenses,
            tone: "error",
          },
        ] as section (section.title)}
            <div>
              <h2 class="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{section.title}</h2>
              {#if section.items.length > 0}
                <ul class="w-full divide-y divide-zinc-100 dark:divide-zinc-700">
                  {#each section.items as item, index (item.category)}
                    <li
                      class="motion-list-item flex items-center justify-between gap-3 py-3"
                      style={`--motion-index: ${Math.min(index, 8)}`}
                    >
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="text-lg" aria-hidden="true">{ALL_CATEGORY_EMOJIS[item.category]}</span>
                        <span class="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {formatCategory(item.category)}
                        </span>
                      </div>
                      <span class="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(item.total)}
                      </span>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="border-b border-zinc-100 dark:border-zinc-700 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {section.empty}
                </p>
              {/if}
            </div>
          {/each}
        </section>
      {/if}
    </div>
  </section>
</main>
