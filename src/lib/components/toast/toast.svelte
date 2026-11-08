<script lang="ts">
	import { dismissToast, toasts } from "../../../stores/toast";

	const toastClasses = {
		success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
		info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
		warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
		error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100",
	} as const;
</script>

<div class="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 z-[100] flex w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 flex-col gap-2">
	{#each $toasts as item (item.id)}
		<div
                        class={`motion-toast flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-lg ${toastClasses[item.type]}`}
			role={item.type === "error" ? "alert" : "status"}
		>
			<span>{item.message}</span>
			<button
				type="button"
				class="grid size-7 shrink-0 place-items-center rounded text-lg leading-none opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(item.id)}
			>
				×
			</button>
		</div>
	{/each}
</div>
