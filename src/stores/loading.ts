import { writable } from 'svelte/store';

export const loading = writable(false);
export const loadingMask = writable(false);

export const setLoading = (value: boolean): void => {
  loading.set(value);
};

export const setLoadingMask = (value: boolean): void => {
  loadingMask.set(value);
};
