<script lang="ts">
	import { createForm } from "felte";
	import { onMount } from "svelte";

	import { InputForm, LoadingMask } from "../../lib/components";
	import { normalizePhoneNumber } from "../../lib/utils/clients-utils";
	import {
		loadingMask,
		loadLanguage,
		setLoadingMask,
		showToast,
		translations,
	} from "../../stores";

	onMount(loadLanguage);

	const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

	const submitLogin = async (phone: string, password: string) => {
		if (import.meta.env.MODE === "capacitor" && !apiBaseUrl) {
			throw new Error($translations.apiNotConfigured);
		}

		const res = await fetch(`${apiBaseUrl}/api/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				phone,
				password,
			}),
		});

		const result = await res.json();
		if (!res.ok) {
			throw new Error(result.message ?? $translations.loginFailed);
		}

		return result;
	};

	const { form } = createForm({
		onSubmit: async (values) => {
			const phone = normalizePhoneNumber(values.phone, values.phoneCallingCode);

			try {
				setLoadingMask(true);
				await submitLogin(phone, values.password);
			} catch (error) {
				showToast(
					error instanceof Error ? error.message : $translations.loginFailed,
					"error",
				);
			} finally {
				setLoadingMask(false);
			}
		},
	});

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
	};
</script>

<svelte:head>
	<title>{$translations.loginTitle}</title>
	<meta name="description" content={$translations.loginDescription} />
	<meta name="theme-color" content="#f4f4f5" />
</svelte:head>

<main data-theme="light" class="min-h-dvh bg-zinc-100">
	{#if $loadingMask}
		<LoadingMask text={$translations.loading} />
	{/if}

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
				aria-label={$translations.homeLabel}
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
				<span class="text-lg font-bold tracking-tight"
					>{$translations.brandName}</span
				>
			</a>

			<section class="relative mt-8" aria-labelledby="welcome-heading">
				<p class="text-xs font-semibold tracking-[0.16em] text-zinc-300">
					{$translations.tagline}
				</p>
			</section>

			<aside
				aria-label={$translations.benefitLabel}
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
						{$translations.benefitTitle}
					</h2>
					<p class="mt-0.5 text-xs text-zinc-300">
						{$translations.benefitDescription}
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
					{$translations.signIn}
				</h2>
				<p class="mt-1.5 text-sm text-base-content/60">
					{$translations.signInDescription}
				</p>
			</header>

			<form use:form class="space-y-5" onsubmit={handleSubmit}>
				<InputForm
					id="phone"
					label={$translations.phoneNumber}
					name="phone"
					placeholder={$translations.phonePlaceholder}
					showNumberDropdown
				/>
				<InputForm
					id="password"
					label={$translations.password}
					name="password"
					placeholder={$translations.passwordPlaceholder}
					showPasswordToggle
				/>

				<section
					aria-label={$translations.signInOptions}
					class="flex items-center justify-end gap-3"
				>
					<span class="text-sm font-medium text-zinc-900"
						>{$translations.forgotPassword}</span
					>
				</section>

				<button
					type="submit"
					class="btn h-12 w-full rounded-xl border-zinc-900 bg-zinc-900 text-base font-semibold text-white hover:border-zinc-800 hover:bg-zinc-800"
				>
					{$translations.signIn}
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
					{$translations.newToDompet}
					<span class="font-semibold text-zinc-900"
						>{$translations.createAccount}</span
					>
				</p>
			</form>

			<!-- FOOTER -->
			<footer
				class="mt-auto pt-8 text-center text-xs leading-5 text-base-content/50"
			>
				{$translations.privacyNotice}
			</footer>
		</section>
	</article>
</main>
