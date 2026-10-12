<script lang="ts">
	import { onMount } from 'svelte';
	import ColorPicker from '#lib/components/ColorPicker.svelte';
	import GroupCard from '#lib/components/GroupCard.svelte';
	import WordTile from '#lib/components/WordTile.svelte';
	import type { Group, GroupColor, Tile } from '#lib/connection-types.js';
	import { localPuzzleDate } from '#lib/puzzle-date.js';
	import { loadSavedBoard, saveBoard } from '#lib/board-storage.js';
	import { resolve } from '$app/paths';

	let entryText = $state('');
	let tiles = $state<Tile[]>([]);
	let selectedIds = $state<number[]>([]);
	let groups = $state<Group[]>([]);
	let nextGroupId = $state(1);
	let loadingToday = $state(false);
	let loadError = $state('');
	let loadStatus = $state('');
	let storageReady = $state(false);
	let storageError = $state(false);

	onMount(() => {
		const saved = loadSavedBoard();
		if (saved) {
			entryText = saved.entryText;
			tiles = saved.tiles;
			selectedIds = saved.selectedIds;
			groups = saved.groups;
			nextGroupId = saved.nextGroupId;
		}
		storageReady = true;
	});

	function persistBoard() {
		storageError = !saveBoard({ entryText, tiles, selectedIds, groups, nextGroupId });
	}

	function updateEntryText(value: string) {
		entryText = value;
		persistBoard();
	}

	let parsedEntries = $derived(
		entryText
			.split(/,|\n/)
			.map((entry) => entry.trim())
			.filter(Boolean)
	);
	let selectedCount = $derived(selectedIds.length);
	let hasBoard = $derived(tiles.length > 0 || groups.length > 0);

	async function loadTodayWords() {
		if (loadingToday) return;
		loadingToday = true;
		loadError = '';
		loadStatus = '';
		// Read the browser's local calendar date at the time of the click, not UTC.
		const date = localPuzzleDate();
		try {
			const response = await fetch(resolve('/api/connections/[date]', { date }), {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(15_000)
			});
			const result = await response.json();
			if (!response.ok) {
				loadError =
					typeof result.message === 'string'
						? result.message
						: 'Could not load today’s words. Please try again.';
				return;
			}
			if (
				!Array.isArray(result.words) ||
				result.words.length !== 16 ||
				!result.words.every((word: unknown) => typeof word === 'string' && word.trim())
			) {
				throw new Error('Could not load today’s words. Please try again.');
			}
			updateEntryText(result.words.join('\n'));
			loadStatus = `Loaded the words for ${date}.`;
		} catch {
			loadError = 'Could not load today’s words. Please try again.';
		} finally {
			loadingToday = false;
		}
	}

	function createBoard() {
		if (parsedEntries.length !== 16) return;
		tiles = parsedEntries.map((label, index) => ({ id: index + 1, label }));
		selectedIds = [];
		groups = [];
		nextGroupId = 1;
		persistBoard();
	}

	function toggleTile(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((selectedId) => selectedId !== id);
			persistBoard();
			return;
		}
		if (selectedIds.length < 4) selectedIds = [...selectedIds, id];
		persistBoard();
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
		persistBoard();
	}

	function changeGroupColor(groupId: number, color: GroupColor) {
		groups = groups.map((group) => (group.id === groupId ? { ...group, color } : group));
		persistBoard();
	}

	function restoreGroup(groupId: number) {
		const group = groups.find((candidate) => candidate.id === groupId);
		if (!group) return;
		tiles = [...group.tiles, ...tiles];
		groups = groups.filter((candidate) => candidate.id !== groupId);
		selectedIds = [];
		persistBoard();
	}

	function shuffleTiles() {
		const shuffled = [...tiles];
		for (let index = shuffled.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
		}
		tiles = shuffled;
		persistBoard();
	}

	function deselectAll() {
		selectedIds = [];
		persistBoard();
	}

	function startOver() {
		tiles = [];
		groups = [];
		selectedIds = [];
		nextGroupId = 1;
		persistBoard();
	}
</script>

<svelte:head>
	<title>Connection Board</title>
	<meta name="description" content="Sort sixteen words into possible groups." />
</svelte:head>

<main class="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#211f1b] sm:px-6 sm:py-10">
	<div class="mx-auto w-full max-w-4xl">
		{#if storageError}
			<p class="mb-4 text-sm text-[#a52b24]" role="status">
				Your browser couldn’t save your progress. Keep this page open to avoid losing it.
			</p>
		{/if}
		{#if !storageReady}
			<p class="pt-[10vh] text-center text-sm text-[#625e55]" role="status">Restoring board…</p>
		{:else if !hasBoard}
			<div class="mx-auto max-w-2xl pt-[10vh]">
				<textarea
					bind:value={() => entryText, updateEntryText}
					disabled={loadingToday}
					rows="10"
					aria-label="Puzzle words"
					placeholder="Paste exactly 16 words or short phrases, separated by commas or new lines"
					class="block w-full resize-none rounded-xl border border-[#c9c4b9] bg-white p-4 text-base leading-7 outline-none placeholder:text-[#aaa59b] focus:border-[#292722] focus:ring-1 focus:ring-[#292722]"
				></textarea>
				<div class="mt-3 flex flex-wrap justify-between gap-3">
					<button
						type="button"
						onclick={loadTodayWords}
						disabled={loadingToday}
						class="rounded-full border border-[#c6c1b7] bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:border-[#24221e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] disabled:cursor-wait disabled:opacity-60"
					>
						{loadingToday ? 'Loading…' : 'Load today’s words'}
					</button>
					<button
						type="button"
						onclick={createBoard}
						disabled={loadingToday || parsedEntries.length !== 16}
						class="rounded-full bg-[#24221e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3b3933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] disabled:cursor-not-allowed disabled:bg-[#c7c3ba]"
					>
						Create board
					</button>
				</div>
				<p class="mt-3 text-sm text-[#625e55]" role="status">
					{loadingToday ? 'Loading today’s puzzle…' : loadStatus}
				</p>
				{#if loadError}
					<p class="mt-3 text-sm text-[#a52b24]" role="alert">{loadError}</p>
				{/if}
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
					<p class="text-center text-xs leading-5 text-[#625e55]">
						Look up a meaning: tap the search icon, press and hold a word, or Shift-click it.
					</p>
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
					<div class="flex w-full flex-wrap gap-2 sm:w-auto">
						<button
							type="button"
							onclick={shuffleTiles}
							class="flex-1 rounded-full border border-[#c6c1b7] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#24221e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] sm:flex-none"
						>
							Shuffle
						</button>
						<button
							type="button"
							onclick={deselectAll}
							disabled={selectedCount === 0}
							class="flex-1 rounded-full border border-[#c6c1b7] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#24221e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
						>
							Deselect all
						</button>
					</div>
					<ColorPicker disabled={selectedCount !== 4} onselect={saveGroup} />
				</div>
			{/if}
		{/if}
	</div>
</main>
