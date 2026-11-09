<script lang="ts">
  import { validator } from "@felte/validator-yup";
  import { createForm } from "felte";
  import * as yup from "yup";

  import {
    BUDGET_CATEGORIES_EXPENSE,
    BUDGET_CATEGORIES_INCOME,
    EXPENSE_KEYWORD_MAP,
    INCOME_KEYWORD_MAP,
  } from "@/constants";
  import { getCategoryTranslationKey } from "@/i18n";
  import { checkAuth } from "@/lib/services/auth";
  import { apiBaseUrl } from "@/lib/utils";
  import {
    autoCategorization,
    setAutoCategorization,
  } from "@/stores/auto-categorization";
  import { showToast } from "@/stores/toast";
  import { notifyTransactionsChanged } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";
  import type { Category } from "@/types";

  const transactionSchema = yup.object({
    type: yup.mixed<"IN" | "OUT">().oneOf(["IN", "OUT"]).required(),
    amount: yup
      .number()
      .typeError(t("invalidTransactionAmount"))
      .required(t("fieldRequired"))
      .min(1, t("invalidTransactionAmount"))
      .integer(t("invalidTransactionAmount")),
    description: yup
      .string()
      .trim()
      .max(200, t("invalidTransactionDescription"))
      .required(t("invalidTransactionDescription")),
    category: yup
      .mixed<Category>()
      .oneOf([...BUDGET_CATEGORIES_EXPENSE, ...BUDGET_CATEGORIES_INCOME])
      .required(t("fieldRequired")),
    date: yup
      .string()
      .required(t("invalidTransactionDate"))
      .test("valid-date", t("invalidTransactionDate"), (value) => {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [year, month, day] = value.split("-").map(Number);
        const parsedDate = new Date(Date.UTC(year, month - 1, day));
        return (
          parsedDate.getUTCFullYear() === year &&
          parsedDate.getUTCMonth() === month - 1 &&
          parsedDate.getUTCDate() === day
        );
      }),
  });

  type TransactionFormValues = Omit<
    yup.InferType<typeof transactionSchema>,
    "amount"
  > & { amount: number | string };

  type TransactionType = "IN" | "OUT";
  type CategoryKeywordMatcher = {
    type: TransactionType;
    category: Category;
    regex: RegExp;
  };

  const createKeywordRegex = (keyword: string) => {
    const escapedKeyword = keyword
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");

    return new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapedKeyword})(?=$|[^\\p{L}\\p{N}_])`,
      "iu",
    );
  };

  const categoryKeywordMatchers: CategoryKeywordMatcher[] = [
    ...Object.entries(EXPENSE_KEYWORD_MAP).flatMap(([category, keywords]) =>
      keywords.map((keyword) => ({
        type: "OUT" as const,
        category: category as Category,
        regex: createKeywordRegex(keyword),
      })),
    ),
    ...Object.entries(INCOME_KEYWORD_MAP).flatMap(([category, keywords]) =>
      keywords.map((keyword) => ({
        type: "IN" as const,
        category: category as Category,
        regex: createKeywordRegex(keyword),
      })),
    ),
  ];

  const detectCategory = (description: string) => {
    let bestMatch:
      | { type: TransactionType; category: Category; index: number; length: number }
      | undefined;

    for (const matcher of categoryKeywordMatchers) {
      const match = matcher.regex.exec(description);
      if (!match) continue;

      const boundaryLength = match[1].length;
      const index = match.index + boundaryLength;
      const length = match[0].length - boundaryLength;
      if (
        !bestMatch ||
        length > bestMatch.length ||
        (length === bestMatch.length && index < bestMatch.index)
      ) {
        bestMatch = { type: matcher.type, category: matcher.category, index, length };
      }
    }

    return bestMatch
      ? { type: bestMatch.type, category: bestMatch.category }
      : undefined;
  };

  const initialTransactionValues = (): TransactionFormValues => ({
    type: "OUT",
    amount: "",
    description: "",
    category: BUDGET_CATEGORIES_EXPENSE[0],
    date: new Date().toISOString().slice(0, 10),
  });

  let dialog = $state<HTMLDialogElement>();
  let isSaving = $state(false);

  const { form, data, errors, setFields, reset } =
    createForm<TransactionFormValues>({
      initialValues: initialTransactionValues(),
      extend: validator({ schema: transactionSchema }),
      onSubmit: async (values) => {
        if (isSaving) return;
        isSaving = true;

        try {
          const authData = await checkAuth();
          if (!authData) throw new Error(t("invalidCredentials", $language));

          const [year, month, day] = values.date.split("-").map(Number);
          const transactionDate = new Date(
            year,
            month - 1,
            day,
            12,
          ).toISOString();
          const response = await fetch(`${apiBaseUrl}/api/transactions-list`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authData.accessToken}`,
            },
            body: JSON.stringify({
              amount: Number(values.amount),
              description: values.description.trim(),
              type: values.type,
              category: values.category,
              date: transactionDate,
            }),
          });

          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as {
              error?: unknown;
              message?: unknown;
            } | null;
            const message =
              typeof result?.error === "string"
                ? result.error
                : typeof result?.message === "string"
                  ? result.message
                  : t("transactionCreateFailed", $language);
            throw new Error(message);
          }

          showToast(t("transactionCreateSuccess", $language), "success");
          notifyTransactionsChanged();
          closeDialog();
        } catch (error) {
          showToast(
            error instanceof Error
              ? error.message
              : t("transactionCreateFailed", $language),
            "error",
          );
        } finally {
          isSaving = false;
        }
      },
    });

  const categories = $derived(
    $data.type === "IN"
      ? BUDGET_CATEGORIES_INCOME
      : BUDGET_CATEGORIES_EXPENSE,
  );

  const openDialog = () => {
    dialog?.showModal();
  };

  const resetForm = () => {
    reset();
    setFields(initialTransactionValues());
  };

  const closeDialog = () => {
    dialog?.close();
    resetForm();
  };

  $effect(() => {
    if (!$autoCategorization) return;

    const description = String($data.description ?? "").trim();
    if (!description) return;

    const timeout = setTimeout(() => {
      const match = detectCategory(description);
      if (!match) return;

      setFields("type", match.type);
      setFields("category", match.category);
    }, 400);

    return () => clearTimeout(timeout);
  });

  const changeType = (type: "IN" | "OUT") => {
    setFields("type", type);
    setFields("category",
      type === "IN"
        ? BUDGET_CATEGORIES_INCOME[0]
        : BUDGET_CATEGORIES_EXPENSE[0]);
  };
</script>

<div class="flex h-16 min-w-0 items-center justify-center">
  <button
    type="button"
    class="motion-add-button relative z-[60] grid size-14 shrink-0 place-items-center rounded-full border-4 border-white bg-emerald-700 text-white shadow-lg shadow-emerald-900/25 transition-transform active:scale-95 dark:border-zinc-900"
    aria-label={t("addTransaction", $language)}
    title={t("addTransaction", $language)}
    onclick={openDialog}
  >
    <svg
      aria-hidden="true"
      class="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>
</div>

<dialog
  bind:this={dialog}
  class="motion-dialog fixed inset-0 m-auto hidden h-full max-h-none w-full max-w-none items-center justify-center overflow-hidden border-0 bg-transparent p-[max(1rem,env(safe-area-inset-top))_1rem_max(1rem,env(safe-area-inset-bottom))] text-current backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm open:flex"
>
  <button
    type="button"
    class="absolute inset-0 z-0 cursor-default bg-zinc-950/50 backdrop-blur-sm"
    aria-label={t("cancel", $language)}
    onclick={closeDialog}
  ></button>
  <section class="motion-dialog-panel relative z-10 max-h-[86dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white px-5 pt-4 pb-5 text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
    <header class="mb-5 flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
            {t("transactionBookkeeping", $language)}
          </p>
          <h2 class="truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t("addTransactionTitle", $language)}
          </h2>
        </div>
      </div>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label={t("cancel", $language)}
        onclick={closeDialog}
      >
        <svg
          aria-hidden="true"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </header>

    <form use:form class="space-y-4 gap-4" novalidate>
      <fieldset
        class="grid grid-cols-2 overflow-hidden rounded-lg"
        aria-label={t("transactionType", $language)}
      >
        <button
          type="button"
          aria-pressed={$data.type === "OUT"}
          onclick={() => changeType("OUT")}
          class={`motion-tap flex min-h-11 items-center justify-center border px-3 text-sm font-semibold transition-colors ${$data.type === "OUT" ? "border-rose-700 bg-rose-700 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
        >
          {t("transactionOut", $language)}
        </button>
        <button
          type="button"
          aria-pressed={$data.type === "IN"}
          onclick={() => changeType("IN")}
          class={`motion-tap flex min-h-11 items-center justify-center border px-3 text-sm font-semibold transition-colors ${$data.type === "IN" ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
        >
          {t("transactionIn", $language)}
        </button>
      </fieldset>

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >{t("transactionAmount", $language)}</span
        >
        <input
          class="h-12 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          type="number"
          name="amount"
          min="1"
          step="1"
          inputmode="decimal"
        />
      </label>
      {#if $errors.amount?.[0]}
        <p class="-mt-3 text-sm text-rose-700 dark:text-rose-300" role="alert">{$errors.amount[0]}</p>
      {/if}

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >{t("transactionDescription", $language)}</span
        >
        <input
          class="h-12 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          type="text"
          name="description"
          maxlength="200"
        />
      </label>
      {#if $errors.description?.[0]}
        <p class="-mt-3 text-sm text-rose-700 dark:text-rose-300" role="alert">{$errors.description[0]}</p>
      {/if}

      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {t("autoCategorization", $language)}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={$autoCategorization}
          aria-label={t("autoCategorization", $language)}
          class={`motion-tap relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${$autoCategorization ? "bg-emerald-700" : "bg-zinc-300 dark:bg-zinc-700"}`}
          onclick={() => setAutoCategorization(!$autoCategorization)}
        >
          <span
            aria-hidden="true"
            class={`size-4 rounded-full bg-white transition-transform ${$autoCategorization ? "translate-x-6" : "translate-x-1"}`}
          ></span>
        </button>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >{t("transactionCategory", $language)}</span
        >
        <select name="category" class="h-12 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
          {#each categories as option (option)}
            <option value={option}
              >{t(getCategoryTranslationKey(option), $language)}</option
            >
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >{t("transactionDate", $language)}</span
        >
        <input
          class="h-12 w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          type="date"
          name="date"
        />
      </label>
      {#if $errors.date?.[0]}
        <p class="-mt-3 text-sm text-rose-700 dark:text-rose-300" role="alert">{$errors.date[0]}</p>
      {/if}

      <button
        type="submit"
        class={`motion-tap flex h-12 w-full items-center justify-center rounded-lg px-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${$data.type === "IN" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}`}
        disabled={isSaving}
      >
        {#if isSaving}
          <span class="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-label={t("loading", $language)}></span>
        {:else}
          {t("saveTransaction", $language)}
        {/if}
      </button>
    </form>
  </section>
</dialog>
