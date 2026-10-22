<script>
	import InputForm from "../../lib/components/inputForm.svelte";

	const title = "Dompet \n Tracker";
</script>

<main class="w-full h-screen flex flex-col items-center">
	<header
		class="w-full flex flex-col h-1/3 justify-center items-center gap-2 bg-zinc-800 rounded-b-2xl"
	>
		<h1 class="text-4xl font-bold text-white">Dompet Tracker</h1>
		<p class="text-md text-gray-300 text-center">
			Your personal finance manager
		</p>
	</header>
	<form class="w-full max-w-md mx-auto space-y-4 mt-8">
		<InputForm label="Email address" />
	</form>
</main>
