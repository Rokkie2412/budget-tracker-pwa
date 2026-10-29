<script lang="ts">
  import {
    BUDGET_CATEGORIES_EXPENSE,
    BUDGET_CATEGORIES_INCOME,
  } from "@/constants";
  import { getCategoryTranslationKey } from "@/i18n";
  import { checkAuth } from "@/lib/services/auth";
  import { apiBaseUrl } from "@/lib/utils";
  import { showToast } from "@/stores/toast";
  import { notifyTransactionsChanged } from "@/stores/transactions-changed";
  import { language, t } from "@/stores/translation";
  import type { Category } from "@/types";

  let dialog = $state<HTMLDialogElement>();
  let transactionType = $state<"IN" | "OUT">("OUT");
  let amount = $state("");
  let description = $state("");
  let category = $state<Category>(BUDGET_CATEGORIES_EXPENSE[0]);
  let date = $state(new Date().toISOString().slice(0, 10));
  let isSaving = $state(false);

  const categories = $derived(
    transactionType === "IN"
      ? BUDGET_CATEGORIES_INCOME
      : BUDGET_CATEGORIES_EXPENSE,
  );

  const openDialog = () => {
    dialog?.showModal();
  };

  const resetForm = () => {
    transactionType = "OUT";
    amount = "";
    description = "";
    category = BUDGET_CATEGORIES_EXPENSE[0];
    date = new Date().toISOString().slice(0, 10);
  };

  const closeDialog = () => {
    dialog?.close();
    resetForm();
  };

  const changeType = (type: "IN" | "OUT") => {
    transactionType = type;
    category =
      type === "IN"
        ? BUDGET_CATEGORIES_INCOME[0]
        : BUDGET_CATEGORIES_EXPENSE[0];
  };

  const saveTransaction = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSaving) return;
    isSaving = true;

    try {
      const authData = await checkAuth();
      if (!authData) throw new Error(t("invalidCredentials", $language));

      const [year, month, day] = date.split("-").map(Number);
      const transactionDate = new Date(year, month - 1, day, 12).toISOString();
      const response = await fetch(`${apiBaseUrl}/api/transactions-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.jwtToken}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: description.trim(),
          type: transactionType,
          category,
          date: transactionDate,
        }),
      });

      if (!response.ok)
        throw new Error(t("transactionCreateFailed", $language));

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
  };
</script>

<div class="flex h-16 min-w-0 items-center justify-center">
  <button
    type="button"
    class="relative z-[60] grid size-14 shrink-0 place-items-center rounded-full border-4 border-base-100 bg-emerald-700 text-white shadow-lg shadow-emerald-900/25 transition-transform active:scale-95"
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

<dialog bind:this={dialog} class="add-transaction-dialog">
  <button
    type="button"
    class="absolute inset-0 z-0 cursor-default bg-zinc- 950/50 backdrop-blur-sm"
    aria-label={t("cancel", $language)}
    onclick={closeDialog}
  ></button>
  <section class="add-transaction-sheet relative z-10 px-5 pt-4">
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
          <p class="text-xs font-semibold uppercase text-emerald-700">
            {t("transactionBookkeeping", $language)}
          </p>
          <h2 class="truncate text-xl font-bold text-base-content">
            {t("addTransactionTitle", $language)}
          </h2>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
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

    <form class="space-y-4 gap-4" onsubmit={saveTransaction}>
      <fieldset
        class="join grid grid-cols-2"
        aria-label={t("transactionType", $language)}
      >
        <label
          class={`btn join-item ${transactionType === "OUT" ? "btn-error" : "btn-ghost border border-base-300"}`}
        >
          <input
            type="radio"
            name="new-transaction-type"
            class="sr-only"
            checked={transactionType === "OUT"}
            onchange={() => changeType("OUT")}
          />
          {t("transactionOut", $language)}
        </label>
        <label
          class={`btn join-item ${transactionType === "IN" ? "btn-success" : "btn-ghost border border-base-300"}`}
        >
          <input
            type="radio"
            name="new-transaction-type"
            class="sr-only"
            checked={transactionType === "IN"}
            onchange={() => changeType("IN")}
          />
          {t("transactionIn", $language)}
        </label>
      </fieldset>

      <label class="form-control gap-1.5">
        <span class="text-sm font-semibold text-base-content"
          >{t("transactionAmount", $language)}</span
        >
        <input
          class="input input-bordered w-full"
          type="number"
          min="1"
          step="1"
          inputmode="decimal"
          bind:value={amount}
          required
        />
      </label>

      <label class="form-control gap-1.5">
        <span class="text-sm font-semibold text-base-content"
          >{t("transactionDescription", $language)}</span
        >
        <input
          class="input input-bordered w-full"
          type="text"
          maxlength="200"
          bind:value={description}
          required
        />
      </label>

      <label class="form-control gap-1.5">
        <span class="text-sm font-semibold text-base-content"
          >{t("transactionCategory", $language)}</span
        >
        <select class="select select-bordered w-full" bind:value={category}>
          {#each categories as option (option)}
            <option value={option}
              >{t(getCategoryTranslationKey(option), $language)}</option
            >
          {/each}
        </select>
      </label>

      <label class="form-control gap-1.5">
        <span class="text-sm font-semibold text-base-content"
          >{t("transactionDate", $language)}</span
        >
        <input
          class="input input-bordered w-full"
          type="date"
          bind:value={date}
          required
        />
      </label>

      <button
        type="submit"
        class={`btn w-full ${transactionType === "IN" ? "btn-success" : "btn-error"}`}
        disabled={isSaving}
      >
        {#if isSaving}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          {t("saveTransaction", $language)}
        {/if}
      </button>
    </form>
  </section>
</dialog>

<style>
  .add-transaction-dialog {
    position: fixed;
    inset: 0;
    display: none;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    margin: 0;
    padding: max(1rem, env(safe-area-inset-top)) 1rem
      max(1rem, env(safe-area-inset-bottom));
    box-sizing: border-box;
    overflow: hidden;
    border: 0;
    color: inherit;
    align-items: center;
    justify-content: center;
    box-shadow: 0 24px 70px rgb(9 9 11 / 0.24);
  }

  .add-transaction-dialog[open] {
    display: flex;
  }

  .add-transaction-dialog::backdrop {
    background: transparent;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
  }

  .add-transaction-sheet {
    width: min(100%, 28rem);
    max-height: 86dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--color-base-300);
    border-radius: 1.25rem;
    background: var(--color-base-100);
    color: var(--color-base-content);
    padding-bottom: 1.25rem;
    box-shadow: 0 24px 70px rgb(9 9 11 / 0.24);
    animation: add-dialog-enter 180ms ease-out both;
  }

  @keyframes add-dialog-enter {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .add-transaction-sheet {
      animation: none;
    }
  }
</style>
