import type { RequestHandler } from '@sveltejs/kit';

import { BUDGET_CATEGORIES_EXPENSE, BUDGET_CATEGORIES_INCOME } from '@/constants';
import { decryptDescription, encryptDescription } from '@/lib/server/description-crypto';
import type { Category } from '@/types';

const ALL_CATEGORIES: readonly string[] = [
	...BUDGET_CATEGORIES_EXPENSE,
	...BUDGET_CATEGORIES_INCOME,
];

const getTransactionType = (category: string): 'IN' | 'OUT' | null => {
	if (BUDGET_CATEGORIES_INCOME.includes(category as never)) return 'IN';
	if (BUDGET_CATEGORIES_EXPENSE.includes(category as never)) return 'OUT';
	return null;
};

const getRange = (
	dateInput?: string,
	startDateInput?: string,
	endDateInput?: string,
	): { start: Date; end: Date } | null | undefined => {
	if (startDateInput || endDateInput) {
		if (!startDateInput || !endDateInput) return null;
		const start = new Date(startDateInput);
		const end = new Date(endDateInput);
		return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
			? null
			: { start, end };
	}
	if (!dateInput) return undefined;

	const targetDate = new Date(dateInput);
	if (Number.isNaN(targetDate.getTime())) return null;
	return {
		start: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
		end: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999),
	};
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.userId;
	const supabase = locals.supabase;
	if (!userId || !supabase) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const requestedUserId = url.searchParams.get('userId');
	if (requestedUserId && requestedUserId !== userId) {
		return Response.json({ message: "Unauthorized: You don't have access to this data." }, { status: 403 });
	}

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 10));
	const range = getRange(
		url.searchParams.get('date') ?? undefined,
		url.searchParams.get('startDate') ?? undefined,
		url.searchParams.get('endDate') ?? undefined,
	);
	if (range === null) return Response.json({ message: 'Invalid date format.' }, { status: 400 });

	let query = supabase
		.from('transactions')
		.select('transaction_id, amount, description, created_at, category', { count: 'exact' })
		.eq('userId', userId);
	if (range) {
		query = query
			.gte('created_at', range.start.toISOString())
			.lte('created_at', range.end.toISOString());
	}

	const requestedType = url.searchParams.get('type')?.trim().toUpperCase();
	if (requestedType === 'IN' || requestedType === 'INCOME') {
		query = query.in('category', [...BUDGET_CATEGORIES_INCOME]);
	} else if (requestedType === 'OUT' || requestedType === 'EXPENSE') {
		query = query.in('category', [...BUDGET_CATEGORIES_EXPENSE]);
	}

	const requestedCategory = url.searchParams.get('category');
	if (requestedCategory && requestedCategory !== 'all' && ALL_CATEGORIES.includes(requestedCategory)) {
		query = query.eq('category', requestedCategory);
	}

	const { data, count, error } = await query
		.order('created_at', { ascending: false })
		.range((page - 1) * limit, page * limit - 1);
	if (error) {
		return Response.json({ message: 'Could not retrieve transactions.', error: error.message }, { status: 500 });
	}

	let transactions: {
		_id: string;
		amount: number;
		description: string;
		date: string;
		type: 'IN' | 'OUT' | null;
		category: string;
	}[];
	try {
		transactions = (data ?? []).map((transaction) => ({
			_id: String(transaction.transaction_id),
			amount: Number(transaction.amount),
			description: decryptDescription(transaction.description ?? ''),
			date: transaction.created_at,
			type: getTransactionType(transaction.category),
			category: transaction.category,
		}));
	} catch {
		return Response.json(
			{ message: 'Could not decrypt transaction descriptions. Check the server encryption key.' },
			{ status: 500 },
		);
	}
	const totalTransactions = count ?? 0;

	return Response.json({
		message: 'Success retrieving transactions.',
		data: {
			transactions,
			pagination: {
				page,
				limit,
				totalTransactions,
				totalPages: Math.ceil(totalTransactions / limit),
			},
		},
	});
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.userId;
	const supabase = locals.supabase;
	if (!userId || !supabase) return Response.json({ message: 'Unauthorized' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
	}
	if (
		typeof body !== 'object' ||
		body === null ||
		!('transactionId' in body) ||
		typeof body.transactionId !== 'string' ||
		body.transactionId.trim().length === 0 ||
		body.transactionId.length > 128
	) {
		return Response.json({ message: 'A valid transactionId is required.' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('transactions')
		.delete()
		.eq('transaction_id', body.transactionId)
		.eq('userId', userId)
		.select('transaction_id');
	if (error) {
		return Response.json({ message: 'Could not delete the transaction.', error: error.message }, { status: 500 });
	}
	if (!data?.length) return Response.json({ message: 'Transaction not found.' }, { status: 404 });
	return Response.json({ message: 'Transaction deleted.' });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.userId;
	const supabase = locals.supabase;
	if (!userId || !supabase) return Response.json({ message: 'Unauthorized' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
	}
	if (typeof body !== 'object' || body === null) {
		return Response.json({ message: 'Invalid transaction details.' }, { status: 400 });
	}

	const { amount, description, type, category, date } = body as Record<string, unknown>;
	const normalizedDescription = typeof description === 'string' ? description.trim() : '';
	const parsedDate = typeof date === 'string' ? new Date(date) : new Date(Number.NaN);
	const validCategories = type === 'IN'
		? BUDGET_CATEGORIES_INCOME
		: type === 'OUT'
			? BUDGET_CATEGORIES_EXPENSE
			: [];

	if (
		typeof amount !== 'number' ||
		!Number.isFinite(amount) ||
		amount <= 0 ||
		amount > 1_000_000_000_000 ||
		normalizedDescription.length === 0 ||
		normalizedDescription.length > 200 ||
		!validCategories.includes(category as never) ||
		Number.isNaN(parsedDate.getTime())
	) {
		return Response.json({ message: 'Invalid transaction details.' }, { status: 400 });
	}

	let encryptedDescription: string;
	try {
		encryptedDescription = encryptDescription(normalizedDescription);
	} catch {
		return Response.json(
			{ message: 'Transaction encryption is unavailable. Configure ENCRYPTION_KEY on the server with at least 32 bytes.' },
			{ status: 503 },
		);
	}

	const { error } = await supabase.from('transactions').insert({
		userId,
		amount,
		description: encryptedDescription,
		category: category as Category,
		created_at: parsedDate.toISOString(),
	});
	if (error) {
		return Response.json({ message: 'Could not save the transaction.', error: error.message }, { status: 500 });
	}
	return Response.json({ message: 'Transaction created.' }, { status: 201 });
};