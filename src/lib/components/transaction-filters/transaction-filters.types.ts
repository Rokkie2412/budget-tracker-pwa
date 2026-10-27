import type { Category } from "@/types";

export type TransactionTypeFilter = "all" | "IN" | "OUT";
export type TransactionDatePeriod =
  | "all"
  | "today"
  | "last7Days"
  | "lastMonth"
  | "custom";

export type TransactionFiltersState = {
  type: TransactionTypeFilter;
  category: Category | "all";
  period: TransactionDatePeriod;
  startDate: string;
  endDate: string;
};

export type Props = {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
};