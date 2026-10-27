import { writable } from "svelte/store";

export type ReportPeriod = {
  year: number;
  month: number;
};

const STORAGE_KEY = "selectedReportPeriod";
const now = new Date();

export const reportPeriod = writable<ReportPeriod>({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
});

export const setReportPeriod = (period: ReportPeriod): void => {
  if (!Number.isInteger(period.year) || period.year < 2000) return;
  if (!Number.isInteger(period.month) || period.month < 1 || period.month > 12) return;

  reportPeriod.set(period);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  }
};

export const loadReportPeriod = (): void => {
  if (typeof window === "undefined") return;

  const savedPeriod = localStorage.getItem(STORAGE_KEY);
  if (!savedPeriod) return;

  try {
    const period = JSON.parse(savedPeriod) as ReportPeriod;
    if (
      Number.isInteger(period.year) &&
      period.year >= 2000 &&
      Number.isInteger(period.month) &&
      period.month >= 1 &&
      period.month <= 12
    ) {
      reportPeriod.set(period);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
};