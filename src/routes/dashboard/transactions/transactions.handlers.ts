import type { TransactionFiltersState } from "@/lib/components/transaction-filters/transaction-filters.types";
import { checkAuth } from "@/lib/services/auth";
import { apiBaseUrl } from "@/lib/utils";
import { showToast } from "@/stores/toast";
import { t } from "@/stores/translation";
import type { PaginationMeta } from "@/types";

import type { Transaction, TransactionsResponse } from "./transactions.types";

type HandlerState = {
  getFilters: () => TransactionFiltersState;
  getCurrentPage: () => number;
  getTransactions: () => Transaction[];
  getResponse: () => TransactionsResponse;
  getPagination: () => PaginationMeta | undefined;
  getDeletingTransactionId: () => string | null;
  setFilters: (filters: TransactionFiltersState) => void;
  setResponse: (response: TransactionsResponse) => void;
  setCurrentPage: (page: number) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadError: (message: string | null) => void;
  setDeletingTransactionId: (id: string | null) => void;
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatTransactionDate = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(date));

export const formatTransactionAmount = (
  amount: number,
  type: Transaction["type"],
): string => `${type === "IN" ? "+" : "−"}${rupiah.format(amount)}`;

export const createTransactionHandlers = (state: HandlerState) => {
  let requestSequence = 0;

  const fetchTransactions = async (
    targetPage: number,
    selectedFilters: TransactionFiltersState = state.getFilters(),
  ): Promise<void> => {
    const requestId = ++requestSequence;
    state.setLoading(true);
    state.setLoadError(null);

    try {
      const authData = await checkAuth();
      if (!authData) throw new Error(t("invalidCredentials"));

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
        throw new Error(
          result.errorMessage ?? `${t("transactionsError")} (${response.status})`,
        );
      }
      if (requestId !== requestSequence) return;

      state.setResponse(result);
      state.setCurrentPage(result.data?.pagination?.page ?? targetPage);
    } catch (error) {
      if (requestId === requestSequence) {
        state.setLoadError(
          error instanceof Error ? error.message : t("transactionsError"),
        );
      }
    } finally {
      if (requestId === requestSequence) state.setLoading(false);
    }
  };

  const nextPage = (): void => {
    const pagination = state.getPagination();
    const currentPage = state.getCurrentPage();
    if (currentPage < (pagination?.totalPages ?? 0)) {
      void fetchTransactions(currentPage + 1);
    }
  };

  const previousPage = (): void => {
    const currentPage = state.getCurrentPage();
    if (currentPage > 1) void fetchTransactions(currentPage - 1);
  };

  const handlePageChange = (event: CustomEvent<number>): void => {
    if (event.detail > state.getCurrentPage()) nextPage();
    else previousPage();
  };

  const handleFiltersChange = (nextFilters: TransactionFiltersState): void => {
    state.setFilters(nextFilters);
    state.setCurrentPage(1);
    void fetchTransactions(1, nextFilters);
  };

  const deleteTransaction = async (transaction: Transaction): Promise<void> => {
    if (state.getDeletingTransactionId()) return;
    state.setDeletingTransactionId(transaction._id);

    try {
      const authData = await checkAuth();
      if (!authData) throw new Error(t("invalidCredentials"));

      const response = await fetch(`${apiBaseUrl}/api/transactions-list`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.jwtToken}`,
        },
        body: JSON.stringify({ transactionId: transaction._id }),
      });

      if (!response.ok) throw new Error(t("transactionDeleteFailed"));

      const currentResponse = state.getResponse();
      const responseData = currentResponse.data;
      const remainingTransactions = state
        .getTransactions()
        .filter((item) => item._id !== transaction._id);

      showToast(
        t("transactionDeleteSuccess").replace("{title}", transaction.description),
        "success",
      );

      if (!responseData?.pagination) {
        state.setResponse({
          ...currentResponse,
          data: { ...responseData, transactions: remainingTransactions },
        });
        return;
      }

      const totalTransactions = Math.max(
        0,
        responseData.pagination.totalTransactions - 1,
      );
      const totalPages = Math.ceil(totalTransactions / responseData.pagination.limit);
      const currentPage = state.getCurrentPage();
      const targetPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

      if (targetPage !== currentPage && totalPages > 0) {
        await fetchTransactions(targetPage);
      } else {
        state.setResponse({
          ...currentResponse,
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
        });
        state.setCurrentPage(targetPage);
      }
    } catch {
      showToast(t("transactionDeleteFailed"), "error");
    } finally {
      state.setDeletingTransactionId(null);
    }
  };

  return {
    deleteTransaction,
    fetchTransactions,
    handleFiltersChange,
    handlePageChange,
    nextPage,
    previousPage,
  };
};