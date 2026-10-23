import { BUDGET_CATEGORIES_EXPENSE, BUDGET_CATEGORIES_INCOME } from "../constants";

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

export interface ITransaction {
  _id?: string;
  userId: string;
  amount: number;
  description: string;
  date: Date;
  type: "OUT" | "IN";
  category?: BudgetCategory;
}
