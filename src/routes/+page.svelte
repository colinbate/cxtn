<script lang="ts">
	import ColorPicker from '#lib/components/ColorPicker.svelte';
	import GroupCard from '#lib/components/GroupCard.svelte';
	import WordTile from '#lib/components/WordTile.svelte';
	import type { Group, GroupColor, Tile } from '#lib/connection-types.js';

	let entryText = $state('');
	let tiles = $state<Tile[]>([]);
	let selectedIds = $state<number[]>([]);
	let groups = $state<Group[]>([]);
	let nextGroupId = $state(1);

	let parsedEntries = $derived(
		entryText
			.split(/,|\n/)
			.map((entry) => entry.trim())
			.filter(Boolean)
	);
	let selectedCount = $derived(selectedIds.length);
	let hasBoard = $derived(tiles.length > 0 || groups.length > 0);

	function createBoard() {
		if (parsedEntries.length !== 16) return;
		tiles = parsedEntries.map((label, index) => ({ id: index + 1, label }));
		selectedIds = [];
		groups = [];
		nextGroupId = 1;
	}

	function toggleTile(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((selectedId) => selectedId !== id);
			return;
		}
		if (selectedIds.length < 4) selectedIds = [...selectedIds, id];
	}

	function saveGroup(color: GroupColor) {
		if (selectedIds.length !== 4) return;
		groups = [
			...groups,
			{
				id: nextGroupId,
				color,
				tiles: tiles.filter((tile) => selectedIds.includes(tile.id))
			}
		];
		tiles = tiles.filter((tile) => !selectedIds.includes(tile.id));
		selectedIds = [];
		nextGroupId += 1;
	}

	function changeGroupColor(groupId: number, color: GroupColor) {
		groups = groups.map((group) => (group.id === groupId ? { ...group, color } : group));
	}

	function restoreGroup(groupId: number) {
		const group = groups.find((candidate) => candidate.id === groupId);
		if (!group) return;
		tiles = [...group.tiles, ...tiles];
		groups = groups.filter((candidate) => candidate.id !== groupId);
		selectedIds = [];
	}

	function shuffleTiles() {
		const shuffled = [...tiles];
		for (let index = shuffled.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
		}
		tiles = shuffled;
	}

	function startOver() {
		tiles = [];
		groups = [];
		selectedIds = [];
	}
</script>

<svelte:head>
	<title>Connection Board</title>
	<meta name="description" content="Sort sixteen words into possible groups." />
</svelte:head>

<main class="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#211f1b] sm:px-6 sm:py-10">
	<div class="mx-auto w-full max-w-4xl">
		{#if !hasBoard}
			<div class="mx-auto max-w-2xl pt-[10vh]">
				<textarea
					bind:value={entryText}
					rows="10"
					aria-label="Puzzle words"
					placeholder="Paste exactly 16 words or short phrases, separated by commas or new lines"
					class="block w-full resize-none rounded-xl border border-[#c9c4b9] bg-white p-4 text-base leading-7 outline-none placeholder:text-[#aaa59b] focus:border-[#292722] focus:ring-1 focus:ring-[#292722]"
				></textarea>
				<div class="mt-3 flex justify-end">
					<button
						type="button"
						onclick={createBoard}
						disabled={parsedEntries.length !== 16}
						class="rounded-full bg-[#24221e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3b3933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] disabled:cursor-not-allowed disabled:bg-[#c7c3ba]"
					>
						Create board
					</button>
				</div>
			</div>
		{:else}
			<div class="mb-5 flex justify-end pt-1">
				<button
					type="button"
					onclick={startOver}
					class="rounded-full border border-[#c6c1b7] bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:border-[#24221e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]"
				>
					New board
				</button>
			</div>

			<div class="flex flex-col gap-3">
				{#each groups as group (group.id)}
					<GroupCard
						{group}
						onrestore={() => restoreGroup(group.id)}
						oncolorchange={(color) => changeGroupColor(group.id, color)}
					/>
				{/each}

				{#if tiles.length > 0}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{#each tiles as tile (tile.id)}
							<WordTile
								label={tile.label}
								selected={selectedIds.includes(tile.id)}
								disabled={selectedCount === 4 && !selectedIds.includes(tile.id)}
								onselect={() => toggleTile(tile.id)}
							/>
						{/each}
					</div>
				{/if}
			</div>

			{#if tiles.length > 0}
				<div
					class="mt-5 flex flex-col-reverse items-center justify-between gap-3 rounded-2xl border border-[#d7d2c8] bg-white p-2.5 shadow-sm sm:flex-row"
				>
					<button
						type="button"
						onclick={shuffleTiles}
						class="w-full rounded-full border border-[#c6c1b7] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#24221e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] sm:w-auto"
					>
						Shuffle
					</button>
					<ColorPicker disabled={selectedCount !== 4} onselect={saveGroup} />
				</div>
			{/if}
		{/if}
	</div>
</main>
