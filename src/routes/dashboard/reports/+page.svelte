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
  class="mx-auto flex h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md flex-col overflow-hidden px-4 pt-5 pb-4"
>
  <section class="flex min-h-0 w-full flex-1 flex-col gap-4">
    <header class="shrink-0 border-b border-zinc-200 pb-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t("transactionBookkeeping", $language)}
      </p>
      <h1 class="mt-1 text-3xl font-bold text-zinc-900">
        {t("reportsTitle", $language)}
      </h1>
      <p class="mt-1 text-sm text-zinc-500">
        {t("reportsDescription", $language)}
      </p>
    </header>

    <div class="grid shrink-0 grid-cols-[1fr_auto] gap-2" aria-label={t("reportsTitle", $language)}>
      <label class="sr-only" for="report-month">{t("reportMonth", $language)}</label>
      <select
        id="report-month"
        class="select select-bordered min-w-0 bg-white"
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
        class="select select-bordered w-28 bg-white"
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
        <div class="flex min-h-48 items-center justify-center" role="status" aria-label={t("transactionsLoading", $language)}>
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      {:else if errorMessage}
        <div class="flex min-h-48 flex-col items-center justify-center gap-3 text-center" role="alert">
          <p class="font-semibold text-red-600">{t("reportLoadFailed", $language)}</p>
          <p class="text-sm text-zinc-500">{errorMessage}</p>
          <button type="button" class="btn btn-sm btn-outline" onclick={() => loadReport()}>
            {t("reportRetry", $language)}
          </button>
        </div>
      {:else if report}
        <section class="stats stats-vertical mb-5 w-full rounded-lg border border-zinc-200 bg-white shadow-none" aria-label={t("reportsTitle", $language)}>
        <div class="stat px-4 py-3">
          <div class="stat-title">{t("reportBalance", $language)}</div>
          <div class={`stat-value text-2xl ${report.summary.total >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatCurrency(report.summary.total)}
          </div>
        </div>
        <div class="stat border-t border-zinc-100 px-4 py-3">
          <div class="stat-title">{t("reportIncome", $language)}</div>
          <div class="stat-value text-xl text-emerald-700">
            {formatCurrency(report.summary.income)}
          </div>
        </div>
        <div class="stat border-t border-zinc-100 px-4 py-3">
          <div class="stat-title">{t("reportExpenses", $language)}</div>
          <div class="stat-value text-xl text-rose-700">
            {formatCurrency(report.summary.expense)}
          </div>
        </div>
        </section>

        <button
          type="button"
          class="btn btn-outline mb-5 w-full justify-between border-emerald-200 text-emerald-800"
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
              <h2 class="mb-1 text-base font-semibold text-zinc-900">{section.title}</h2>
              {#if section.items.length > 0}
                <ul class="list w-full divide-y divide-zinc-100">
                  {#each section.items as item (item.category)}
                    <li class="flex items-center justify-between gap-3 py-3">
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="text-lg" aria-hidden="true">{ALL_CATEGORY_EMOJIS[item.category]}</span>
                        <span class="truncate text-sm font-medium text-zinc-800">
                          {formatCategory(item.category)}
                        </span>
                      </div>
                      <span class="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(item.total)}
                      </span>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="border-b border-zinc-100 py-4 text-sm text-zinc-500">
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
