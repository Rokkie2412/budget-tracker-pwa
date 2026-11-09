import { json, type RequestHandler } from '@sveltejs/kit';

import { BUDGET_CATEGORIES_EXPENSE, BUDGET_CATEGORIES_INCOME } from '@/constants';
import type {
	CategoryBreakdownItem,
	ExpenseCategory,
	IncomeCategory,
	MonthlyReportResponse,
} from '@/types';

const getTargetMonth = (searchParams: URLSearchParams) => {
	const now = new Date();
	const rawMonth = searchParams.get('month');
	const match = rawMonth?.match(/^(\d{4})-(\d{1,2})$/);
	const year = match ? Number(match[1]) : Number(searchParams.get('year')) || now.getFullYear();
	const month = match ? Number(match[2]) : Number(rawMonth) || now.getMonth() + 1;
	return Number.isInteger(year) && month >= 1 && month <= 12
		? { year, month }
		: null;
};

export const GET: RequestHandler = async ({ locals, url }): Promise<Response> => {
	const userId = locals.user?.userId;
	const supabase = locals.supabase;
	if (!userId || !supabase) return json({ message: 'Unauthorized' }, { status: 401 });

	const requestedUserId = url.searchParams.get('userId');
	if (requestedUserId && requestedUserId !== userId) {
		return json({ message: "Unauthorized: You don't have access to this data." }, { status: 403 });
	}

	const targetMonth = getTargetMonth(url.searchParams);
	if (!targetMonth) return json({ message: 'Invalid month.' }, { status: 400 });
	const { year, month } = targetMonth;
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0, 23, 59, 59, 999);
	const { data: transactions, error } = await supabase
		.from('transactions')
		.select('amount, category, created_at')
		.eq('userId', userId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString());
	if (error) {
		return json({ message: 'Could not retrieve monthly report.', error: error.message }, { status: 500 });
	}

	let incomeTotal = 0;
	let expenseTotal = 0;
	const categoryTotals = new Map<string, { type: 'IN' | 'OUT'; category: string; total: number; count: number }>();
	const dailyTotals = new Map<number, { income: number; expense: number }>();

	for (const transaction of transactions ?? []) {
		const isIncome = BUDGET_CATEGORIES_INCOME.includes(transaction.category as never);
		const isExpense = BUDGET_CATEGORIES_EXPENSE.includes(transaction.category as never);
		if (!isIncome && !isExpense) continue;

		const type = isIncome ? 'IN' : 'OUT';
		const amount = Number(transaction.amount);
		const day = new Date(transaction.created_at).getDate();
		if (isIncome) incomeTotal += amount;
		else expenseTotal += amount;

		const categoryKey = `${type}:${transaction.category}`;
		const currentCategory = categoryTotals.get(categoryKey) ?? {
			type,
			category: transaction.category,
			total: 0,
			count: 0,
		};
		currentCategory.total += amount;
		currentCategory.count += 1;
		categoryTotals.set(categoryKey, currentCategory);

		const currentDay = dailyTotals.get(day) ?? { income: 0, expense: 0 };
		if (isIncome) currentDay.income += amount;
		else currentDay.expense += amount;
		dailyTotals.set(day, currentDay);
	}

	const expenses: CategoryBreakdownItem<ExpenseCategory>[] = [];
	const income: CategoryBreakdownItem<IncomeCategory>[] = [];
	for (const item of categoryTotals.values()) {
		if (item.type === 'IN') {
			income.push({
				category: item.category as IncomeCategory,
				total: item.total,
				count: item.count,
				percentage: incomeTotal > 0 ? Number(((item.total / incomeTotal) * 100).toFixed(1)) : 0,
			});
		} else {
			expenses.push({
				category: item.category as ExpenseCategory,
				total: item.total,
				count: item.count,
				percentage: expenseTotal > 0 ? Number(((item.total / expenseTotal) * 100).toFixed(1)) : 0,
			});
		}
	}
	expenses.sort((left, right) => right.total - left.total);
	income.sort((left, right) => right.total - left.total);

	const daysInMonth = new Date(year, month, 0).getDate();
	const timeline = Array.from({ length: daysInMonth }, (_, index) => {
		const day = index + 1;
		const totals = dailyTotals.get(day);
		return { day, income: totals?.income ?? 0, expense: totals?.expense ?? 0 };
	});
	const responseBody: MonthlyReportResponse = {
		message: 'Success retrieving monthly report.',
		data: {
			year,
			month,
			timeline,
			summary: {
				total: incomeTotal - expenseTotal,
				income: incomeTotal,
				expense: expenseTotal,
			},
			categories: { expenses, income },
		},
	};
	return json(responseBody);
};