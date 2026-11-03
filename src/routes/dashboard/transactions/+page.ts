import type { PageLoad } from './$types';

export const load: PageLoad = ({ depends }) => {
	depends('app:transactions');

	return {
		transactions: {
			data: {
				transactions: [],
				pagination: {
					page: 1,
					limit: 10,
					totalTransactions: 0,
					totalPages: 0,
				},
			},
		},
		errorMessage: null,
	};
};
