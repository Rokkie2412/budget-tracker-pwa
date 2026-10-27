import { json, type RequestHandler } from "@sveltejs/kit";

import { connectDataBase, hashUserId } from "@/lib/utils/index.server";
import Transaction from "@/models/transaction-list";
import type {
  CategoryBreakdownItem,
  ExpenseCategory,
  IncomeCategory,
  MonthlyReportResponse,
} from "@/types";

interface AggregationSummaryItem {
  totalIncome: number;
  totalExpense: number;
}

interface AggregationCategoryItem {
  _id: {
    type: "IN" | "OUT";
    category: string;
  };
  total: number;
  count: number;
}

interface AggregationDailyItem {
	_id: number;
	income: number;
	expense: number;
}

interface MonthlyReportAggregation {
  summary: AggregationSummaryItem[];
  categories: AggregationCategoryItem[];
  daily: AggregationDailyItem[];
}

const getTargetMonth = (searchParams: URLSearchParams) => {
  const now = new Date();
  let year = Number(searchParams.get("year")) || now.getFullYear();
  const monthParam = searchParams.get("month");

  let month = now.getMonth() + 1;

  if (monthParam) {
    if (/^\d{4}-\d{1,2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m;
    } else {
      const parsedMonth = Number(monthParam);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
      }
    }
  }

  return { year, month };
};

export const GET: RequestHandler = async ({ locals, url }): Promise<Response> => {
  try {
    const rawUserId = url.searchParams.get("userId") ?? "";
    const normalizedUserId = rawUserId.startsWith(" ")
      ? "+" + rawUserId.trim()
      : rawUserId.trim();

    if (!normalizedUserId || locals.user?.userId !== normalizedUserId) {
      return json(
        { message: "Unauthorized: You don't have access to this data." },
        { status: 403 },
      );
    }

    const userId = normalizedUserId;

    await connectDataBase();

    const { year, month } = getTargetMonth(url.searchParams);
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [result]: MonthlyReportAggregation[] = await Transaction.aggregate([
      {
        $match: {
          userId: hashUserId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalIncome: {
                  $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0] },
                },
                totalExpense: {
                  $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0] },
                },
              },
            },
          ],
          categories: [
            {
              $group: {
                _id: { type: "$type", category: "$category" },
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
          ],
          daily: [
            {
              $group: {
                _id: { $dayOfMonth: "$date" },
                income: {
                  $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0] },
                },
                expense: {
                  $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const summaryRaw = result?.summary?.[0];
    const incomeTotal = summaryRaw?.totalIncome ?? 0;
    const expenseTotal = summaryRaw?.totalExpense ?? 0;

    const expenses: CategoryBreakdownItem<ExpenseCategory>[] = [];
    const income: CategoryBreakdownItem<IncomeCategory>[] = [];
    const dailyByDay = new Map(
      (result?.daily ?? []).map((item) => [item._id, item]),
    );
    const daysInMonth = new Date(year, month, 0).getDate();
    const timeline = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const totals = dailyByDay.get(day);
      return {
        day,
        income: totals?.income ?? 0,
        expense: totals?.expense ?? 0,
      };
    });

    for (const item of result?.categories ?? []) {
      const { type, category } = item._id;
      const total = item.total;
      const count = item.count;

      if (type === "OUT") {
        const percentage =expenseTotal > 0 ? Number(((total / expenseTotal) * 100).toFixed(1)) : 0;
        expenses.push({
          category: category as ExpenseCategory,
          total,
          count,
          percentage,
        });
      } else if (type === "IN") {
        const percentage =
          incomeTotal > 0 ? Number(((total / incomeTotal) * 100).toFixed(1)) : 0;
        income.push({
          category: category as IncomeCategory,
          total,
          count,
          percentage,
        });
      }
    }

    const responseBody: MonthlyReportResponse = {
      message: "Success retrieving monthly report.",
      data: {
        year,
        month,
        timeline,
        summary: {
          total: incomeTotal - expenseTotal,
          income: incomeTotal,
          expense: expenseTotal,
        },
        categories: {
          expenses,
          income,
        },
      },
    };

    return json(responseBody);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return json(
      { message: "An error occurred on the server.", error: errorMessage },
      { status: 500 },
    );
  }
};
