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
</script>

<button
	type="button"
	onclick={onselect}
	{disabled}
	aria-pressed={selected}
	class={[
		'group relative flex min-h-24 items-center justify-center rounded-xl border px-3 py-4 text-center text-sm leading-tight font-extrabold tracking-[0.015em] uppercase transition duration-150 sm:min-h-28 sm:px-4 sm:text-base',
		selected
			? '-translate-y-0.5 border-[#24221e] bg-[#24221e] text-white shadow-[0_6px_0_#cbc6bb]'
			: 'border-[#d7d2c8] bg-[#ece9e2] text-[#282621] hover:-translate-y-0.5 hover:border-[#aaa49a] hover:bg-white hover:shadow-[0_5px_0_#ddd8ce]',
		disabled &&
			'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[#d7d2c8] hover:bg-[#ece9e2] hover:shadow-none'
	]}
>
	<span class="max-w-full break-words">{label}</span>
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
