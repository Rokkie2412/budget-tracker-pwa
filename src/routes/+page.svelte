<script lang="ts">
	import { onMount } from "svelte";

	import { goto } from "$app/navigation";

	import { checkAuth } from "../lib/services/auth";
	import { loadLanguage } from "../stores";

	const checkRouting = async () => {
		try {
			const auth = await checkAuth();
			console.log("Credential tersimpan:", auth !== null);
			await goto(auth ? "/dashboard" : "/login");
		} catch (error: unknown) {
			console.error("Failed to check saved authentication", error);
			await goto("/login");
		}
	};

	onMount(() => {
		loadLanguage();
		checkRouting();
	});
</script>

<svelte:head>
	<title>Dompet Tracker</title>
</svelte:head>
