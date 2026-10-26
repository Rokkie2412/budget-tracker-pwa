import type { Category } from "@/types";

export type Transaction = {
  _id: string;
  amount: number;
  description: string;
  date: string;
  type: "IN" | "OUT";
  category?: Category;
};


export type Props = {
  data: {
    transactions: {
      data?: {
        transactions?: Transaction[];
      };
    };
  };
};

