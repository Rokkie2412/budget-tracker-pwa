<script lang="ts">
	import { validator } from "@felte/validator-yup";
	import { createForm } from "felte";
	import * as yup from "yup";

	import { goto } from "$app/navigation";

	import { InputForm, LoadingMask } from "../../lib/components";
	import { setAuth } from "../../lib/services/auth";
	import { createSupabaseClient } from "../../lib/services/supabase";
	import { loadingMask, setLoadingMask, showToast, t } from "../../stores";

	const registerSchema = yup.object({
		email: yup.string().required(t("fieldRequired")).email(),
		password: yup.string().required(t("fieldRequired")),
		confirmPassword: yup
			.string()
			.required(t("fieldRequired"))
			.oneOf([yup.ref("password")], t("passwordsDoNotMatch")),
	});

	const { form, errors } = createForm<yup.InferType<typeof registerSchema>>({
		extend: validator({ schema: registerSchema }),
		onSubmit: async (values) => {
			try {
				setLoadingMask(true);
				const { data, error } = await createSupabaseClient().auth.signUp({
					email: values.email.trim(),
					password: values.password,
					options: {
						emailRedirectTo: `${window.location.origin}/login`,
					},
				});

				if (error) {
					const alreadyRegistered =
						error.code === "user_already_exists" ||
						error.code === "email_exists" ||
						/already (registered|exists)/i.test(error.message);
					throw new Error(
						alreadyRegistered ? t("emailAlreadyRegistered") : error.message,
					);
				}

				if (data.user?.identities?.length === 0) {
					showToast(t("emailAlreadyRegistered"), "error");
					return;
				}

				if (data.session && data.user) {
					await setAuth({
						accessToken: data.session.access_token,
						refreshToken: data.session.refresh_token,
						expiresAt:
							data.session.expires_at ??
							Math.floor(Date.now() / 1000) + data.session.expires_in,
						userId: data.user.id,
						email: data.user.email ?? values.email.trim(),
					});
					showToast(t("registerSuccess"), "success");
					await goto("/dashboard");
				} else {
					showToast(t("checkEmailConfirmation"), "success");
				}
			} catch (error: unknown) {
				showToast(
					error instanceof Error ? error.message : t("registerFailed"),
					"error",
				);
			} finally {
				setLoadingMask(false);
			}
		},
	});
</script>

<svelte:head>
	<title>{t("registerTitle")}</title>
	<meta name="description" content={t("registerDescription")} />
	<meta name="theme-color" content="#f4f4f5" />
</svelte:head>

<main class="min-h-dvh bg-zinc-100 dark:bg-zinc-800">
	{#if $loadingMask}
		<LoadingMask text={t("loading")} />
	{/if}

	<article
		class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-xl shadow-zinc-900/5 dark:bg-zinc-900"
	>
		<header
			class="relative overflow-hidden rounded-b-4xl bg-zinc-900 px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white"
		>
			<a href="/login" class="relative flex w-fit items-center gap-2.5" aria-label={t("homeLabel")}>
				<span
					class="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
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

			<section class="relative mt-8">
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
				<section>
					<h2 class="text-sm font-semibold">{t("benefitTitle")}</h2>
					<p class="mt-0.5 text-xs text-zinc-300">{t("benefitDescription")}</p>
				</section>
			</aside>
		</header>

		<section class="flex flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
			<header class="mb-6">
				<h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
					{t("signUp")}
				</h1>
				<p class="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
					{t("signUpDescription")}
				</p>
			</header>

			<form use:form class="space-y-5" novalidate>
				<InputForm
					id="email"
					label="Email"
					name="email"
					placeholder="name@example.com"
					inputType="email"
				/>
				{#if $errors.email?.[0]}
					<p class="-mt-3 text-sm text-rose-700" role="alert">{$errors.email[0]}</p>
				{/if}

				<InputForm
					id="password"
					label={t("password")}
					name="password"
					placeholder={t("passwordPlaceholder")}
					showPasswordToggle
				/>
				{#if $errors.password?.[0]}
					<p class="-mt-3 text-sm text-rose-700" role="alert">{$errors.password[0]}</p>
				{/if}

				<InputForm
					id="confirmPassword"
					label={t("confirmPassword")}
					name="confirmPassword"
					placeholder={t("confirmPasswordPlaceholder")}
					showPasswordToggle
				/>
				{#if $errors.confirmPassword?.[0]}
					<p class="-mt-3 text-sm text-rose-700" role="alert">
						{$errors.confirmPassword[0]}
					</p>
				{/if}

				<button
					type="submit"
					class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
				>
					{t("signUp")}
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

				<p class="text-center text-sm text-zinc-600 dark:text-zinc-400">
					{t("alreadyHaveAccount")}
					<a
						href="/login"
						class="font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
					>{t("signIn")}</a>
				</p>
			</form>

			<footer class="mt-auto pt-8 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
				{t("privacyNotice")}
			</footer>
		</section>
	</article>
</main>