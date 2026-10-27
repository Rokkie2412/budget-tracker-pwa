import type { RequestHandler } from "@sveltejs/kit";

import { BUDGET_CATEGORIES_EXPENSE, BUDGET_CATEGORIES_INCOME } from "@/constants";
import { connectDataBase, decrypt, encrypt, hashUserId } from "@/lib/utils/index.server";
import Transaction from "@/models/transaction-list";
import type { Category } from "@/types";

const ALL_CATEGORIES: readonly string[] = [
	...BUDGET_CATEGORIES_EXPENSE,
	...BUDGET_CATEGORIES_INCOME,
];

const handleGetTransactions = async (
	userId: string,
	pageInput: number = 1,
	limitInput: number = 10,
	dateInput?: string | Date,
	startDateInput?: string | Date,
	endDateInput?: string | Date,
	transactionType?: string,
	categoryInput?: string,
): Promise<Response> => {
	const trimmedId = userId?.trim();
	if (
			!trimmedId ||
			trimmedId === "null" ||
			trimmedId === "undefined" ||
			typeof trimmedId !== "string"
	) {
			return Response.json({ message: "Valid userId is required." }, { status: 400 });
	}

	const hashedUserId = hashUserId(trimmedId);

	const page = Math.max(1, Number(pageInput) || 1);
	const limit = Math.max(1, Math.min(100, Number(limitInput) || 10));
	const skip = (page - 1) * limit;

	let rangeStart: Date;
	let rangeEnd: Date;

	if (startDateInput && endDateInput) {
			rangeStart = new Date(startDateInput);
			rangeEnd = new Date(endDateInput);
	} else {
			const targetDate = dateInput ? new Date(dateInput) : new Date();
			if (isNaN(targetDate.getTime())) {
					return Response.json({ message: "Invalid date format." }, { status: 400 });
			}
			const year = targetDate.getFullYear();
			const month = targetDate.getMonth();
			rangeStart = new Date(year, month, 1, 0, 0, 0, 0);
			rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
	}

	const transactionFilter: Record<string, unknown> = {
			userId: hashedUserId,
			date: { $gte: rangeStart, $lte: rangeEnd },
	};

	if (transactionType) {
			const normalizedType = transactionType.trim().toUpperCase();
			if (normalizedType === "IN" || normalizedType === "INCOME") {
					transactionFilter.type = "IN";
			} else if (normalizedType === "OUT" || normalizedType === "EXPENSE") {
					transactionFilter.type = "OUT";
			}
	}

	if (categoryInput && categoryInput.trim() !== "" && categoryInput !== "all") {
			const matchedCategory = ALL_CATEGORIES.find((cat) => cat === categoryInput);
			if (matchedCategory) {
					transactionFilter.category = matchedCategory;
			}
	}

	const [totalTransactions, transactions] = await Promise.all([
			Transaction.countDocuments(transactionFilter),
			Transaction.find(transactionFilter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
	]);

	const totalPages = Math.ceil(totalTransactions / limit);

	const formattedTransactions = transactions.map(
			({ _id, amount, description, date, type, category }) => ({
					_id: _id.toString(),
					amount,
					description: decrypt(description),
					date: date.toISOString(),
					type,
					category,
			}),
	);

	return Response.json({
			message: "Success retrieving transactions.",
			data: {
					transactions: formattedTransactions,
					pagination: {
							page,
							limit,
							totalTransactions,
							totalPages,
					},
			},
	});
};

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
			await connectDataBase();
			const rawUserId = url.searchParams.get("userId") ?? "";
			const userId = rawUserId.startsWith(" ")
				? "+" + rawUserId.trim()
				: rawUserId.trim();
			const date = url.searchParams.get("date") ?? undefined;
			const startDate = url.searchParams.get("startDate") ?? undefined;
			const endDate = url.searchParams.get("endDate") ?? undefined;
			const transactionType = url.searchParams.get("type") ?? undefined;
			const category = url.searchParams.get("category") ?? undefined;
			const page = Number(url.searchParams.get("page")) || 1;
			const limit = Number(url.searchParams.get("limit")) || 10;

			if (locals.user?.userId !== userId) {
					return Response.json(
							{ message: "Unauthorized: You don't have access to this data." },
							{ status: 403 },
					);
			}

			return await handleGetTransactions(
					userId,
					page,
					limit,
					date,
					startDate,
					endDate,
					transactionType,
					category,
			);
	} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
			return Response.json(
					{ message: "An error occurred on the server.", error: errorMessage },
					{ status: 500 },
			);
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.userId?.trim();
	if (!userId) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
	}

	if (
		typeof body !== "object" ||
		body === null ||
		!("transactionId" in body) ||
		typeof body.transactionId !== "string" ||
		!/^[a-f\d]{24}$/i.test(body.transactionId)
	) {
		return Response.json({ message: "A valid transactionId is required." }, { status: 400 });
	}

	try {
		await connectDataBase();
		const result = await Transaction.deleteOne({
			_id: body.transactionId,
			userId: hashUserId(userId),
		});

		if (result.deletedCount === 0) {
			return Response.json({ message: "Transaction not found." }, { status: 404 });
		}

		return Response.json({ message: "Transaction deleted." });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
		return Response.json(
			{ message: "An error occurred while deleting the transaction.", error: errorMessage },
			{ status: 500 },
		);
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.userId?.trim();
	if (!userId) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
	}

	if (typeof body !== "object" || body === null) {
		return Response.json({ message: "Invalid transaction details." }, { status: 400 });
	}

	const { amount, description, type, category, date } = body as Record<string, unknown>;
	const normalizedDescription = typeof description === "string" ? description.trim() : "";
	const parsedDate = typeof date === "string" ? new Date(date) : new Date(Number.NaN);
	const validCategories = type === "IN"
		? BUDGET_CATEGORIES_INCOME
		: type === "OUT"
			? BUDGET_CATEGORIES_EXPENSE
			: [];

	if (
		typeof amount !== "number" ||
		!Number.isFinite(amount) ||
		amount <= 0 ||
		amount > 1_000_000_000_000 ||
		normalizedDescription.length === 0 ||
		normalizedDescription.length > 200 ||
		!validCategories.includes(category as never) ||
		Number.isNaN(parsedDate.getTime())
	) {
		return Response.json({ message: "Invalid transaction details." }, { status: 400 });
	}
	const transactionType = type as "IN" | "OUT";
	const transactionCategory = category as Category;

	try {
		await connectDataBase();
		await Transaction.create({
			userId: hashUserId(userId),
			amount,
			description: encrypt(normalizedDescription),
			date: parsedDate,
			type: transactionType,
			category: transactionCategory,
		});

		return Response.json(
			{ message: "Transaction created." },
			{ status: 201 },
		);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
		return Response.json(
			{ message: "An error occurred while creating the transaction.", error: errorMessage },
			{ status: 500 },
		);
	}
};
