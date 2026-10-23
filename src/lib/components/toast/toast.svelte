<script lang="ts">
	import { dismissToast, toasts } from "../../../stores/toast";

	const alertClasses = {
		success: "alert-success",
		info: "alert-info",
		warning: "alert-warning",
		error: "alert-error",
	} as const;
</script>

<div class="toast toast-top toast-center z-100">
	{#each $toasts as item (item.id)}
		<div
			class={`alert ${alertClasses[item.type]} shadow-lg`}
			role={item.type === "error" ? "alert" : "status"}
		>
			<span>{item.message}</span>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(item.id)}
			>
				×
			</button>
		</div>
	{/each}
</div>
