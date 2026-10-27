import { writable } from "svelte/store";

export const transactionRevision = writable(0);

export const notifyTransactionsChanged = (): void => {
  transactionRevision.update((revision) => revision + 1);
};