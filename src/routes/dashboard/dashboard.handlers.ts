import { checkAuth } from "@/lib/services/auth";
import { apiBaseUrl } from "@/lib/utils";
import { t } from "@/stores/translation";

import type { Transaction, TransactionsResponse } from "./transactions/transactions.types";

export const TRANSACTIONS_PER_PAGE = 10;

export const fetchMonthlyTransactions = async (
  year: number,
  month: number,
  page: number,
): Promise<TransactionsResponse> => {
  const authData = await checkAuth();
  if (!authData) throw new Error(t("invalidCredentials"));

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  const params = new URLSearchParams({
    userId: authData.phoneNumber,
    page: String(page),
    limit: String(TRANSACTIONS_PER_PAGE),
    startDate,
    endDate,
  });
  const response = await fetch(`${apiBaseUrl}/api/transactions-list?${params}`, {
    headers: {
      Authorization: `Bearer ${authData.jwtToken}`,
    },
  });
  const result = (await response.json()) as TransactionsResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message ?? t("transactionsError"));
  }

  return result;
};

export const deleteMonthlyTransaction = async (transaction: Transaction): Promise<void> => {
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
};