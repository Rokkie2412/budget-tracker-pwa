import type { Category } from "@/types";

export type Props = {
  title: string;
  date: string;
  category?: Category;
  amount?: string;
  type?: "IN" | "OUT";
  onDelete?: () => void;
};
