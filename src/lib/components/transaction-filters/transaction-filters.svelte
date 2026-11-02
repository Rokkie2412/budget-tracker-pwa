<script lang="ts">
  import {
    BUDGET_CATEGORIES_EXPENSE,
    BUDGET_CATEGORIES_INCOME,
  } from "@/constants";
  import { getCategoryTranslationKey, type TranslationKeys } from "@/i18n";
  import { language, t } from "@/stores/translation";
  import type { Category } from "@/types";

  import type {
    Props,
    TransactionDatePeriod,
    TransactionFiltersState,
    TransactionTypeFilter,
  } from "./transaction-filters.types";

  let { filters, onChange }: Props = $props();
  let dateDialog = $state<HTMLDialogElement>();
  let draftStartDate = $state("");
  let draftEndDate = $state("");

  const categories = $derived(
    filters.type === "IN"
      ? BUDGET_CATEGORIES_INCOME
      : filters.type === "OUT"
        ? BUDGET_CATEGORIES_EXPENSE
        : [...BUDGET_CATEGORIES_INCOME, ...BUDGET_CATEGORIES_EXPENSE],
  );
  const hasActiveFilters = $derived(
    filters.type !== "all" ||
      filters.category !== "all" ||
      filters.period !== "all",
  );

  const typeOptions: { value: TransactionTypeFilter; label: TranslationKeys }[] = [
    { value: "all", label: "transactionAll" },
    { value: "IN", label: "transactionIn" },
    { value: "OUT", label: "transactionOut" },
  ];

  const dateOptions: {
    value: Exclude<TransactionDatePeriod, "all" | "custom">;
    label: TranslationKeys;
  }[] = [
    { value: "today", label: "today" },
    { value: "last7Days", label: "last7Days" },
    { value: "lastMonth", label: "lastMonth" },
  ];

  const getLocalDateInput = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDateRange = (period: Exclude<TransactionDatePeriod, "all" | "custom">) => {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (period === "last7Days") {
      start.setDate(start.getDate() - 6);
    } else if (period === "lastMonth") {
      const previousMonthLastDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      ).getDate();
      start.setFullYear(today.getFullYear(), today.getMonth() - 1, 1);
      start.setDate(Math.min(today.getDate(), previousMonthLastDay));
    }

    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  function updateType(type: TransactionTypeFilter) {
    onChange({ ...filters, type, category: "all" });
  }

  function updateCategory(value: string) {
    onChange({ ...filters, category: value === "all" ? "all" : (value as Category) });
  }

  function updatePeriod(period: Exclude<TransactionDatePeriod, "all" | "custom">) {
    onChange({ ...filters, period, ...getDateRange(period) });
  }

  function clearFilters() {
    onChange({
      ...filters,
      type: "all",
      category: "all",
      period: "all",
      startDate: "",
      endDate: "",
    });
  }

  function openCustomDateDialog() {
    const today = getLocalDateInput(new Date().toISOString());
    draftStartDate = getLocalDateInput(filters.startDate) || today;
    draftEndDate = getLocalDateInput(filters.endDate) || today;
    dateDialog?.showModal();
  }

  function applyCustomDate() {
    if (!draftStartDate || !draftEndDate || draftStartDate > draftEndDate) return;

    const [startYear, startMonth, startDay] = draftStartDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = draftEndDate.split("-").map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    onChange({
      ...filters,
      period: "custom",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    dateDialog?.close();
  }

  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) dateDialog?.close();
  }
</script>

<section class="shrink-0 space-y-3" aria-label={t("transactionFilters", $language)}>
  <div class="grid gap-2">
    <div class="flex w-full overflow-hidden rounded-lg" role="group" aria-label={t("transactionType", $language)}>
      {#each typeOptions as option (option.value)}
        <button
          type="button"
          class={`min-h-10 min-w-0 flex-1 px-3 text-sm font-semibold transition-colors ${filters.type === option.value ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-200 bg-white text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
          aria-pressed={filters.type === option.value}
          onclick={() => updateType(option.value)}
        >
          {t(option.label, $language)}
        </button>
      {/each}
    </div>

    <label class="sr-only" for="transaction-category">{t("transactionCategory", $language)}</label>
    <select
      id="transaction-category"
      class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      value={filters.category}
      onchange={(event) => updateCategory(event.currentTarget.value)}
    >
      <option value="all">{t("allCategories", $language)}</option>
      {#each categories as category (category)}
        <option value={category}>{t(getCategoryTranslationKey(category), $language)}</option>
      {/each}
    </select>
  </div>

  <div class="flex min-w-0 items-center gap-1">
    <div class="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" role="group" aria-label={t("dateRange", $language)}>
      {#each dateOptions as option (option.value)}
        <button
          type="button"
          class={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${filters.period === option.value ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900" : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
          aria-pressed={filters.period === option.value}
          onclick={() => updatePeriod(option.value)}
        >
          {t(option.label, $language)}
        </button>
      {/each}
      <button
        type="button"
        class={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${filters.period === "custom" ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900" : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
        aria-pressed={filters.period === "custom"}
        onclick={openCustomDateDialog}
      >
        {t("chooseDates", $language)}
      </button>
    </div>

    <button
      type="button"
      class="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
      aria-label={t("clearFilters", $language)}
      disabled={!hasActiveFilters}
      onclick={clearFilters}
    >
      <svg
        aria-hidden="true"
        class="size-3.5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 6h18" />
        <path d="m8 6 1 14h6l1-14" />
        <path d="M10 6V4h4v2" />
      </svg>
      {t("clearFilters", $language)}
    </button>
  </div>
</section>

<dialog
  bind:this={dateDialog}
  class="fixed inset-0 m-auto hidden max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm open:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
  onclick={closeOnBackdrop}
>
  <section>
    <header class="mb-5 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("chooseDateRange", $language)}</h2>
      <button
        type="button"
        class="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label={t("closeDateDialog", $language)}
        onclick={() => dateDialog?.close()}
      >
        <span aria-hidden="true" class="text-xl">×</span>
      </button>
    </header>

    <div class="grid gap-4">
      <label class="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t("fromDate", $language)}
        <input
          class="h-11 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          type="date"
          bind:value={draftStartDate}
          max={draftEndDate || undefined}
        />
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t("untilDate", $language)}
        <input
          class="h-11 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          type="date"
          bind:value={draftEndDate}
          min={draftStartDate || undefined}
        />
      </label>
    </div>

    <footer class="mt-6 flex justify-end gap-2">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onclick={() => dateDialog?.close()}
      >
        {t("cancel", $language)}
      </button>
      <button
        type="button"
        class="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        disabled={!draftStartDate || !draftEndDate || draftStartDate > draftEndDate}
        onclick={applyCustomDate}
      >
        {t("apply", $language)}
      </button>
    </footer>
  </section>
</dialog>