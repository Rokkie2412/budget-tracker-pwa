<script lang="ts">
	import {
		type CountryCode,
		getCountries,
		getCountryCallingCode,
	} from "libphonenumber-js";

	import { language, t } from "../../../stores/translation";
	import type { Props } from "./input-form.types";

	const countries = $derived.by(() => {
		const countryNames = new Intl.DisplayNames([$language], { type: "region" });

		return getCountries()
			.map((code) => ({
				code,
				name: countryNames.of(code) ?? code,
				dialCode: getCountryCallingCode(code),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	let {
		id,
		label,
		name,
		placeholder = "",
		inputType: inputTypeProp = "text",
		showPasswordToggle = false,
		showNumberDropdown = false,
	}: Props = $props();

	let showPassword = $state(false);
	let countryDialog = $state<HTMLDialogElement>();
	let country = $state<CountryCode>("ID");
	let selectedCountry = $derived(
		countries.find((item) => item.code === country) ?? countries[0],
	);
	let inputType = $derived(
		showPasswordToggle
			? showPassword
				? "text"
				: "password"
			: showNumberDropdown
				? "tel"
				: inputTypeProp,
	);

	function closeCountryDialog() {
		countryDialog?.close();
	}

	function countryFlag(code: CountryCode) {
		return [...code].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
	}

	function selectCountry(code: CountryCode) {
		country = code;
		closeCountryDialog();
	}

	function closeOnBackdrop(event: MouseEvent) {
		if (event.target === event.currentTarget) closeCountryDialog();
	}
</script>

<div class="flex w-full flex-col gap-2">
	<label for={id} class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</label
	>

	<div
		class="flex h-12 w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
	>
		{#if showNumberDropdown}
			<button
				type="button"
				class="flex h-full shrink-0 items-center gap-2 border-r border-zinc-300 pr-2 dark:border-zinc-700"
				aria-label={t("currentCallingCode", $language).replace(
					"{code}",
					selectedCountry.dialCode,
				)}
				onclick={() => countryDialog?.showModal()}
			>
				<span aria-hidden="true" class="text-lg">{countryFlag(selectedCountry.code)}</span>
				<span class="text-sm font-semibold">+{selectedCountry.dialCode}</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="size-4 text-zinc-500 dark:text-zinc-400"
				>
					<path
						fill-rule="evenodd"
						d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}

		<input
			{id}
			{name}
			type={inputType}
			inputmode={showNumberDropdown ? "tel" : undefined}
			autocomplete={showNumberDropdown ? "tel-national" : name === "email" ? "email" : "current-password"}
			{placeholder}
			required
			class="min-w-0 grow bg-transparent outline-none placeholder:text-zinc-400"
		/>

		{#if showPasswordToggle}
			<button
				type="button"
				class="shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
				onclick={() => (showPassword = !showPassword)}
			>
				{showPassword
					? t("hidePassword", $language)
					: t("showPassword", $language)}
			</button>
		{/if}
	</div>

	{#if showNumberDropdown}
		<input type="hidden" name={`${name}Country`} value={selectedCountry.code} />
		<input
			type="hidden"
			name={`${name}CallingCode`}
			value={`+${selectedCountry.dialCode}`}
		/>

		<dialog
			bind:this={countryDialog}
			class="fixed inset-0 m-auto hidden max-h-[80dvh] w-full max-w-sm flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm open:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			onclick={closeOnBackdrop}
		>
			<section class="flex min-h-0 flex-col gap-3">
				<header
					class="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700"
				>
					<h2 id={`${id}-country-title`} class="text-lg font-semibold">
						{t("chooseCountry", $language)}
					</h2>
					<button
						type="button"
						class="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						aria-label={t("closeCountrySelector", $language)}
						onclick={closeCountryDialog}
					>
						<svg
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
								d="m6 6 12 12M18 6 6 18"
							/>
						</svg>
					</button>
				</header>

				<ul class="min-h-0 overflow-y-auto">
					{#each countries as item (item.code)}
						<li>
							<button
								type="button"
								class={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${
									country === item.code ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50"
								}`}
								onclick={() => selectCountry(item.code)}
							>
								<span class="flex items-center gap-3">
									<span aria-hidden="true" class="text-lg">{countryFlag(item.code)}</span>
									<span class="text-sm font-medium">{item.name}</span>
								</span>
								<span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
									>+{item.dialCode}</span
								>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		</dialog>
	{/if}
</div>
