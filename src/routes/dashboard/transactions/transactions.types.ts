export type Transaction = {
  _id: string;
  amount: number;
  description: string;
  date: string;
  type: "IN" | "OUT";
  category?: string;
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

