import type { Category } from "@/types";

export type Transaction = {
  _id: string;
  amount: number;
  description: string;
  date: string;
  type: "IN" | "OUT";
  category?: Category;
};

export type TransactionsResponse = {
  data?: {
    transactions?: Transaction[];
    pagination?: {
      page: number;
      limit: number;
      totalTransactions: number;
      totalPages: number;
    };
  };
  errorMessage?: string | null;
};

export type Props = {
  data: {
    transactions: TransactionsResponse;
    errorMessage?: string | null;
  };
};

