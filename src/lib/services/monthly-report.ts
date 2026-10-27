import { checkAuth } from "@/lib/services/auth";
import { apiBaseUrl } from "@/lib/utils";
import { t } from "@/stores/translation";
import type { MonthlyReportResponse } from "@/types";

export const fetchMonthlyReport = async (
  year: number,
  month: number,
): Promise<MonthlyReportResponse> => {
  const authData = await checkAuth();
  if (!authData) throw new Error(t("invalidCredentials"));

  const params = new URLSearchParams({
    userId: authData.phoneNumber,
    year: String(year),
    month: String(month),
  });
  const response = await fetch(`${apiBaseUrl}/api/monthly-report?${params}`, {
    headers: {
      Authorization: `Bearer ${authData.jwtToken}`,
    },
  });
  const result = (await response.json()) as MonthlyReportResponse;

  if (!response.ok) {
    throw new Error(result.message ?? t("reportLoadFailed"));
  }

  return result;
};