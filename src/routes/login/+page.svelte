<script lang="ts">
	import { createForm } from "felte";

	import { goto } from "$app/navigation";

	import { InputForm, LoadingMask } from "../../lib/components";
	import { setAuth } from "../../lib/services/auth";
	import { loadingMask, setLoadingMask, showToast, t } from "../../stores";
	import {
		handleSubmit,
		keyErrorMapper,
		normalizePhoneNumber,
		onSubmitLogin,
	} from "./login.handlers";
	import type { LoginRes } from "./login.types";

	const { form } = createForm({
		onSubmit: async (values) => {
			const phone = normalizePhoneNumber(values.phone, values.phoneCallingCode);

			try {
				setLoadingMask(true);
				const login: LoginRes = await onSubmitLogin(phone, values.password);
				const message = login.message;

				await setAuth(login.token, login.user.userId);
				showToast(keyErrorMapper[message] ?? t("loginSuccess"), "success");
				await goto("/dashboard");
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : t("loginFailed");

				showToast(keyErrorMapper[message] ?? t("loginFailed"), "error");
			} finally {
				setLoadingMask(false);
			}
		},
	});
</script>

<svelte:head>
	<title>{t("loginTitle")}</title>
	<meta name="description" content={t("loginDescription")} />
	<meta name="theme-color" content="#f4f4f5" />
</svelte:head>

<main class="min-h-dvh bg-zinc-100">
	{#if $loadingMask}
		<LoadingMask text={t("loading")} />
	{/if}

	<article
		class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-xl shadow-zinc-900/5"
	>
		<!-- HEADER -->
		<header
			class="relative overflow-hidden rounded-b-4xl bg-zinc-900 px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white"
		>
			<a
				href="/login"
				class="relative flex w-fit items-center gap-2.5"
				aria-label={t("homeLabel")}
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
				<span class="text-lg font-bold tracking-tight">{t("brandName")}</span>
			</a>

			<section class="relative mt-8" aria-labelledby="welcome-heading">
				<p class="text-xs font-semibold tracking-[0.16em] text-zinc-300">
					{t("tagline")}
				</p>
			</section>

			<aside
				aria-label={t("benefitLabel")}
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
						{t("benefitTitle")}
					</h2>
					<p class="mt-0.5 text-xs text-zinc-300">
						{t("benefitDescription")}
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
					{t("signIn")}
				</h2>
				<p class="mt-1.5 text-sm text-base-content/60">
					{t("signInDescription")}
				</p>
			</header>

			<form use:form class="space-y-5" onsubmit={handleSubmit}>
				<InputForm
					id="phone"
					label={t("phoneNumber")}
					name="phone"
					placeholder={t("phonePlaceholder")}
					showNumberDropdown
				/>
				<InputForm
					id="password"
					label={t("password")}
					name="password"
					placeholder={t("passwordPlaceholder")}
					showPasswordToggle
				/>

				<section
					aria-label={t("signInOptions")}
					class="flex items-center justify-end gap-3"
				>
					<span class="text-sm font-medium text-zinc-900"
						>{t("forgotPassword")}</span
					>
				</section>

				<button
					type="submit"
					class="btn h-12 w-full rounded-xl border-zinc-900 bg-zinc-900 text-base font-semibold text-white hover:border-zinc-800 hover:bg-zinc-800"
				>
					{t("signIn")}
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
					{t("newToDompet")}
					<span class="font-semibold text-zinc-900">{t("createAccount")}</span>
				</p>
			</form>

			<!-- FOOTER -->
			<footer
				class="mt-auto pt-8 text-center text-xs leading-5 text-base-content/50"
			>
				{t("privacyNotice")}
			</footer>
		</section>
	</article>
</main>
