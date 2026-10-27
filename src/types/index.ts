import { BUDGET_CATEGORIES_EXPENSE, BUDGET_CATEGORIES_INCOME, CATEGORY_EMOJIS_EXPENSE, CATEGORY_EMOJIS_INCOME } from "../constants";

export type CountryCode = {
  flag: string;
  code: string;
  name: string;
  iso: string;
};

export type ExpenseCategory = (typeof BUDGET_CATEGORIES_EXPENSE)[number];
export type IncomeCategory = (typeof BUDGET_CATEGORIES_INCOME)[number];
export type BudgetCategory = ExpenseCategory | IncomeCategory;

export type IUserConnected = {
  userId: string;
  password: string;
  allowChat: boolean;
}

export type CategoryBreakdownItem<TCategory extends string> = {
  category: TCategory;
  total: number;
  percentage: number;
  count: number;
}

export type CategoryBreakdown = {
  expenses: CategoryBreakdownItem<ExpenseCategory>[];
  income: CategoryBreakdownItem<IncomeCategory>[];
}

export type ITransaction = {
  _id?: string;
  userId: string;
  amount: number;
  description: string;
  date: Date;
  type: "OUT" | "IN";
  category?: BudgetCategory;
}

export type AuthPayload = {
  userId: string;
  phoneNumber: string
}

export type MonthSummary = {
  total: number;
  income: number;
  outcome: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalTransactions: number;
  totalPages: number;
}

export type MonthlyTransactionDetailData = MonthSummary & {
  year: number;
  month: number;
  transactions: ITransaction[];
  pagination: PaginationMeta;
  categories: CategoryBreakdown;
  lastMonth: MonthSummary;
  comparison: MonthComparison;
};

export type MonthComparison = {
  percentage: string | null;
  status: "plus" | "minus" | null;
};

export type MonthlyTransactionDetailResponse = {
  message: string;
  data: MonthlyTransactionDetailData;
};

export type MonthlyReportItem = {
  date: string;
  income: number;
  expense: number;
  total: number;
}

export type MonthlyReportPaginationMeta = {
  page: number;
  limit: number;
  totalMonths: number;
  totalPages: number;
}

export type MonthlyReportPaginatedData = {
  reports: MonthlyReportItem[];
  pagination: MonthlyReportPaginationMeta;
};

export type MonthlyReportData = {
  year: number;
  month: number;
  timeline: MonthlyReportDay[];
  summary: {
    total: number;
    income: number;
    expense: number;
  };
  categories: CategoryBreakdown;
};

export type MonthlyReportDay = {
  day: number;
  income: number;
  expense: number;
};

export type MonthlyReportResponse = {
  message: string;
  data: MonthlyReportData;
};

export const ALL_CATEGORY_EMOJIS: Record<BudgetCategory | IncomeCategory, string> = {
  ...CATEGORY_EMOJIS_EXPENSE,
  ...CATEGORY_EMOJIS_INCOME,
};

export type Category = (typeof BUDGET_CATEGORIES_EXPENSE | typeof BUDGET_CATEGORIES_INCOME)[number];