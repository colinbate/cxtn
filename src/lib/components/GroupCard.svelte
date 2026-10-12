<script lang="ts">
	import type { Group, GroupColor } from '#lib/connection-types.js';
	import ColorPicker from './ColorPicker.svelte';

	let {
		group,
		onrestore,
		oncolorchange
	}: {
		group: Group;
		onrestore: () => void;
		oncolorchange: (color: GroupColor) => void;
	} = $props();

	const colors: Record<GroupColor, string> = {
		yellow: 'bg-cxtn-yellow',
		green: 'bg-cxtn-green',
		blue: 'bg-cxtn-blue',
		purple: 'bg-cxtn-purple',
		gray: 'bg-cxtn-gray'
	};
	let color = $derived(colors[group.color]);
</script>

<article class={['rounded-2xl px-4 py-5 shadow-sm sm:px-5', color]}>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<p class="text-center text-sm leading-6 font-bold tracking-[0.02em] uppercase sm:text-left">
			{group.tiles.map((tile) => tile.label).join(' · ')}
		</p>
		<div class="flex shrink-0 items-center justify-center gap-4">
			<ColorPicker value={group.color} compact onselect={oncolorchange} />
			<button
				type="button"
				onclick={onrestore}
				class="rounded-full px-2 py-1 text-xs font-semibold text-[#37342e]/70 hover:bg-white/40 hover:text-[#211f1b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]"
			>
				Undo
			</button>
		</div>
	</div>
</article>
