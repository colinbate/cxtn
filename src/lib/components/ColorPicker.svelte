<script lang="ts">
	import type { GroupColor } from '#lib/connection-types.js';

	let {
		value,
		disabled = false,
		compact = false,
		onselect
	}: {
		value?: GroupColor;
		disabled?: boolean;
		compact?: boolean;
		onselect: (color: GroupColor) => void;
	} = $props();

	const choices: { value: GroupColor; label: string; classes: string }[] = [
		{ value: 'yellow', label: 'Yellow', classes: 'bg-cxtn-yellow' },
		{ value: 'green', label: 'Green', classes: 'bg-cxtn-green' },
		{ value: 'blue', label: 'Blue', classes: 'bg-cxtn-blue' },
		{ value: 'purple', label: 'Purple', classes: 'bg-cxtn-purple' },
		{ value: 'gray', label: 'Unknown', classes: 'bg-cxtn-gray' }
	];
</script>

<div
	class={[
		'flex w-fit items-center rounded-full border border-black/10 bg-white/65 shadow-sm backdrop-blur-sm',
		compact ? 'gap-1.5 p-1.5' : 'gap-2 p-2'
	]}
>
	{#each choices as choice (choice.value)}
		<button
			type="button"
			{disabled}
			onclick={() => onselect(choice.value)}
			title={choice.label}
			aria-label={compact ? `Change group to ${choice.label}` : `Create ${choice.label} group`}
			aria-pressed={value === choice.value}
			class={[
				'relative flex shrink-0 items-center justify-center rounded-full border-2 border-white/90 text-[#24221e] shadow-sm transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100',
				choice.classes,
				compact ? 'size-7' : 'size-10',
				value === choice.value && 'ring-2 ring-[#24221e] ring-offset-1 ring-offset-transparent'
			]}
		>
			<span class="sr-only">{choice.label}</span>
			{#if value === choice.value}
				<svg
					viewBox="0 0 16 16"
					class="size-3.5"
					fill="none"
					stroke="currentColor"
					stroke-width="2.25"
					aria-hidden="true"
				>
					<path d="m3 8 3 3 7-7" />
				</svg>
			{:else if choice.value === 'gray' && !compact}
				<span class="text-sm leading-none font-bold" aria-hidden="true">?</span>
			{/if}
		</button>
	{/each}
</div>
