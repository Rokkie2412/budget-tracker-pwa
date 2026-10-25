import { error } from '@sveltejs/kit';

import { checkAuth } from '@/lib/services/auth'
import {
  apiBaseUrl
} from "@/lib/utils";

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, depends }) => {
  const authData = await checkAuth();

  if (!authData) {
    throw error(401, "Unauthorized");
  }

  const { jwtToken, phoneNumber } = authData;

  depends('app:transactions');
  const res = await fetch(`${apiBaseUrl}/api/transactions-list?userId=${phoneNumber}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`,
    },
  });
  return { transactions: await res.json() };
};
