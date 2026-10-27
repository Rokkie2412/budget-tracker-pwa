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
    <div class="join flex w-full" role="group" aria-label={t("transactionType", $language)}>
      {#each typeOptions as option (option.value)}
        <button
          type="button"
          class={`btn btn-sm join-item min-w-0 flex-1 ${filters.type === option.value ? "btn-neutral" : "btn-ghost border border-zinc-200 bg-white"}`}
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
      class="select select-sm w-full border-zinc-200 bg-white"
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
          class={`btn btn-xs shrink-0 ${filters.period === option.value ? "btn-outline btn-neutral" : "btn-ghost text-zinc-600"}`}
          aria-pressed={filters.period === option.value}
          onclick={() => updatePeriod(option.value)}
        >
          {t(option.label, $language)}
        </button>
      {/each}
      <button
        type="button"
        class={`btn btn-xs shrink-0 ${filters.period === "custom" ? "btn-outline btn-neutral" : "btn-ghost text-zinc-600"}`}
        aria-pressed={filters.period === "custom"}
        onclick={openCustomDateDialog}
      >
        {t("chooseDates", $language)}
      </button>
    </div>

    <button
      type="button"
      class="btn btn-ghost btn-xs shrink-0 gap-1 px-2 text-zinc-600"
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

<dialog bind:this={dateDialog} class="modal" onclick={closeOnBackdrop}>
  <section class="modal-box max-w-sm">
    <header class="mb-5 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-zinc-900">{t("chooseDateRange", $language)}</h2>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        aria-label={t("closeDateDialog", $language)}
        onclick={() => dateDialog?.close()}
      >
        <span aria-hidden="true" class="text-xl">×</span>
      </button>
    </header>

    <div class="grid gap-4">
      <label class="form-control gap-1 text-sm font-medium text-zinc-700">
        {t("fromDate", $language)}
        <input
          class="input input-bordered w-full"
          type="date"
          bind:value={draftStartDate}
          max={draftEndDate || undefined}
        />
      </label>
      <label class="form-control gap-1 text-sm font-medium text-zinc-700">
        {t("untilDate", $language)}
        <input
          class="input input-bordered w-full"
          type="date"
          bind:value={draftEndDate}
          min={draftStartDate || undefined}
        />
      </label>
    </div>

    <footer class="mt-6 flex justify-end gap-2">
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => dateDialog?.close()}
      >
        {t("cancel", $language)}
      </button>
      <button
        type="button"
        class="btn btn-neutral"
        disabled={!draftStartDate || !draftEndDate || draftStartDate > draftEndDate}
        onclick={applyCustomDate}
      >
        {t("apply", $language)}
      </button>
    </footer>
  </section>
  <form method="dialog" class="modal-backdrop">
    <button aria-label={t("closeDateDialog", $language)}>close</button>
  </form>
</dialog>