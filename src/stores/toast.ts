import { writable } from 'svelte/store';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

type Toast = {
	id: number;
	message: string;
	type: ToastType;
};

export const toasts = writable<Toast[]>([]);

let nextToastId = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const dismissToast = (id: number): void => {
	const timer = timers.get(id);
	if (timer) clearTimeout(timer);
	timers.delete(id);
	toasts.update((items) => items.filter((item) => item.id !== id));
};

export const showToast = (
	message: string,
	type: ToastType = 'info',
	duration = 4000
): void => {
	const id = ++nextToastId;
	toasts.update((items) => [...items, { id, message, type }]);

	if (duration > 0) {
		timers.set(id, setTimeout(() => dismissToast(id), duration));
	}
};
