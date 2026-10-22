<script lang="ts">
	import {
		type CountryCode,
		getCountries,
		getCountryCallingCode,
	} from "libphonenumber-js";

	import { language, translations } from "../../../stores/translation";
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
				: "text",
	);

	function closeCountryDialog() {
		countryDialog?.close();
	}

	function selectCountry(code: CountryCode) {
		country = code;
		closeCountryDialog();
	}

	function closeOnBackdrop(event: MouseEvent) {
		if (event.target === event.currentTarget) closeCountryDialog();
	}
</script>

<div class="form-control w-full gap-2">
	<label for={id} class="text-sm font-semibold text-base-content">{label}</label
	>

	<div
		class="input input-bordered flex h-12 w-full items-center gap-2 bg-base-100"
	>
		{#if showNumberDropdown}
			<button
				type="button"
				class="flex h-full shrink-0 items-center gap-2 border-r border-base-300 pr-2"
				aria-label={$translations.currentCallingCode.replace(
					"{code}",
					selectedCountry.dialCode,
				)}
				onclick={() => countryDialog?.showModal()}
			>
				<span class={`fi fi-${selectedCountry.code.toLowerCase()} rounded-sm`}
				></span>
				<span class="text-sm font-semibold">+{selectedCountry.dialCode}</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="size-4 text-base-content/50"
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
			autocomplete={showNumberDropdown ? "tel-national" : "current-password"}
			{placeholder}
			required
			class="min-w-0 grow"
		/>

		{#if showPasswordToggle}
			<button
				type="button"
				class="btn btn-ghost btn-xs text-base-content/60"
				onclick={() => (showPassword = !showPassword)}
			>
				{showPassword ? $translations.hidePassword : $translations.showPassword}
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

		<dialog bind:this={countryDialog} class="modal" onclick={closeOnBackdrop}>
			<section class="modal-box flex max-h-[80dvh] max-w-sm flex-col gap-3 p-4">
				<header
					class="flex items-center justify-between border-b border-base-200 pb-3"
				>
					<h2 id={`${id}-country-title`} class="text-lg font-semibold">
						{$translations.chooseCountry}
					</h2>
					<button
						type="button"
						class="btn btn-ghost btn-sm btn-square"
						aria-label={$translations.closeCountrySelector}
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
									country === item.code ? "bg-zinc-100" : "hover:bg-zinc-50"
								}`}
								onclick={() => selectCountry(item.code)}
							>
								<span class="flex items-center gap-3">
									<span class={`fi fi-${item.code.toLowerCase()} rounded-sm`}
									></span>
									<span class="text-sm font-medium">{item.name}</span>
								</span>
								<span class="text-sm font-semibold text-base-content/70"
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
