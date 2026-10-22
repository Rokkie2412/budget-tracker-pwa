<script lang="ts">
	import { InputForm } from "../../lib/components";
	import { createForm } from "felte";

	const { form } = createForm({
		onSubmit: (values) => {
			console.log("VALUES", values);
		},
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
	}
</script>

<svelte:head>
	<title>Sign in | Dompet</title>
	<meta
		name="description"
		content="Sign in to Dompet and get a clearer picture of your personal finances."
	/>
	<meta name="theme-color" content="#f4f4f5" />
</svelte:head>

<main data-theme="light" class="min-h-dvh bg-zinc-100">
	<!-- HEADER -->
	<article
		class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-xl shadow-zinc-900/5"
	>
		<header
			class="relative overflow-hidden rounded-b-4xl bg-zinc-900 px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white"
		>
			<a
				href="/login"
				class="relative flex w-fit items-center gap-2.5"
				aria-label="Dompet home"
			>
				<span
					class="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-900"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="size-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 7.5h16v11H4zM4 7.5l2-3h12l2 3M15 13h5"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 13a2 2 0 1 0 0 4h4v-4z"
						/>
					</svg>
				</span>
				<span class="text-lg font-bold tracking-tight">DOMPET TRACKER</span>
			</a>

			<section class="relative mt-8" aria-labelledby="welcome-heading">
				<p class="text-xs font-semibold tracking-[0.16em] text-zinc-300">
					YOUR MONEY, IN BALANCE
				</p>
				<h1
					id="welcome-heading"
					class="mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-tight"
				>
					Good to see you again.
				</h1>
				<p class="mt-2 max-w-xs text-sm leading-6 text-zinc-300">
					Sign in to pick up where you left off.
				</p>
			</section>

			<aside
				aria-label="Dompet benefit"
				class="relative mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4"
			>
				<span
					class="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-zinc-200"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						class="size-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7"
						/>
					</svg>
				</span>
				<section aria-labelledby="benefit-heading">
					<h2 id="benefit-heading" class="text-sm font-semibold">
						A clearer picture starts here
					</h2>
					<p class="mt-0.5 text-xs text-zinc-300">
						Your finances, all in one place.
					</p>
				</section>
			</aside>
		</header>

		<!-- BODY -->
		<section
			class="flex flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8"
		>
			<header class="mb-6">
				<h2 class="text-2xl font-bold tracking-tight text-base-content">
					Sign in
				</h2>
				<p class="mt-1.5 text-sm text-base-content/60">
					Enter your details to access your account.
				</p>
			</header>

			<form use:form class="space-y-5" onsubmit={handleSubmit}>
				<InputForm
					id="phone"
					label="Phone number"
					name="phone"
					placeholder="Enter your phone number"
					showNumberDropdown
				/>
				<InputForm
					id="password"
					label="Password"
					name="password"
					placeholder="Enter your password"
					showPasswordToggle
				/>

				<section
					aria-label="Sign-in options"
					class="flex items-center justify-end gap-3"
				>
					<span class="text-sm font-medium text-zinc-900">Forgot password?</span
					>
				</section>

				<button
					type="submit"
					class="btn h-12 w-full rounded-xl border-zinc-900 bg-zinc-900 text-base font-semibold text-white hover:border-zinc-800 hover:bg-zinc-800"
				>
					Sign in
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M5 12h14m-6-6 6 6-6 6"
						/>
					</svg>
				</button>

				<p class="text-center text-sm text-base-content/60">
					New to Dompet? <span class="font-semibold text-zinc-900"
						>Create an account</span
					>
				</p>
			</form>

			<!-- FOOTER -->
			<footer
				class="mt-auto pt-8 text-center text-xs leading-5 text-base-content/50"
			>
				Your financial information stays private and secure.
			</footer>
		</section>
	</article>
</main>
