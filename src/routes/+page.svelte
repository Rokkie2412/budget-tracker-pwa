<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';

	onMount(() => {
		void goto('/login');
	});
</script>

<svelte:head>
	<title>Dompet Tracker</title>
</svelte:head>
