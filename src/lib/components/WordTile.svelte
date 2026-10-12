<script lang="ts">
	let {
		label,
		selected = false,
		disabled = false,
		onselect
	}: {
		label: string;
		selected?: boolean;
		disabled?: boolean;
		onselect: () => void;
	} = $props();

	let lookupUrl = $derived(
		`https://www.google.com/search?q=${encodeURIComponent(`${label} meaning`)}`
	);
</script>

<div class="relative min-w-0">
	<button
		type="button"
		onclick={onselect}
		{disabled}
		aria-pressed={selected}
		class={[
			'group relative flex h-full min-h-24 w-full touch-pan-y items-center justify-center rounded-xl border px-3 pt-8 pb-8 text-center text-sm leading-tight font-extrabold tracking-[0.015em] uppercase transition duration-150 select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] sm:min-h-28 sm:px-4 sm:text-base',
			selected
				? '-translate-y-0.5 border-[#24221e] bg-[#24221e] text-white shadow-[0_6px_0_#cbc6bb]'
				: 'border-[#d7d2c8] bg-[#ece9e2] text-[#282621] hover:-translate-y-0.5 hover:border-[#aaa49a] hover:bg-white hover:shadow-[0_5px_0_#ddd8ce]',
			disabled &&
				'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[#d7d2c8] hover:bg-[#ece9e2] hover:shadow-none'
		]}
	>
		<span class="max-w-full wrap-break-word">{label}</span>
		<span
			class={[
				'absolute top-2 right-2 flex size-4 items-center justify-center rounded-full border transition',
				selected
					? 'border-white/60 bg-white text-[#24221e]'
					: 'border-[#beb9af] bg-transparent text-transparent'
			]}
			aria-hidden="true"
		>
			<svg viewBox="0 0 12 12" class="size-2.5" fill="none" stroke="currentColor" stroke-width="2"
				><path d="m2 6 2.5 2.5L10 3" /></svg
			>
		</span>
	</button>
	<a
	aria-label="Search word"
	href={lookupUrl}
	target="_blank"
		class={[
			'absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]',
			selected ? 'text-white/70 hover:text-white' : 'text-[#625e55] hover:text-[#211f1b]'
		]}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			class="size-4"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
		>
			<circle cx="10.5" cy="10.5" r="6.5" />
			<path d="m16 16 5 5" />
		</svg>
	</a>
</div>
