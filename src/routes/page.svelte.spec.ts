import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BoardPage from './+page.svelte';
import { BOARD_STORAGE_KEY, type BoardState } from '#lib/board-storage.js';

const words = Array.from({ length: 16 }, (_, index) => `WORD ${index + 1}`);
const tiles = words.map((label, index) => ({ id: index + 1, label }));
const saved: BoardState = {
	entryText: words.join('\n'),
	tiles: tiles.slice(4).reverse(),
	selectedIds: [16, 8],
	groups: [{ id: 2, color: 'green', tiles: tiles.slice(0, 4) }],
	nextGroupId: 4
};

function stored(): BoardState {
	return JSON.parse(localStorage.getItem(BOARD_STORAGE_KEY)!);
}

beforeEach(() => localStorage.removeItem(BOARD_STORAGE_KEY));
afterEach(() => {
	vi.restoreAllMocks();
	localStorage.removeItem(BOARD_STORAGE_KEY);
});

describe('board persistence', () => {
	it('restores a working board without first overwriting its save', async () => {
		localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify({ ...saved, version: 1 }));
		const write = vi.spyOn(Storage.prototype, 'setItem');
		const view = await render(BoardPage);
		await expect
			.element(page.getByRole('button', { name: 'WORD 16', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'WORD 8', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'Change group to Green' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(write).not.toHaveBeenCalled();

		await page.getByRole('button', { name: 'WORD 16', exact: true }).click();
		expect(stored().selectedIds).toEqual([8]);
		await view.unmount();
		await render(BoardPage);
		await expect
			.element(page.getByRole('button', { name: 'WORD 16', exact: true }))
			.toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(page.getByRole('button', { name: 'WORD 8', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(stored().tiles.map((tile) => tile.label)).toEqual(words.slice(4).reverse());
	});

	it('saves a new board, groups, colors, shuffling, deselection, and undo', async () => {
		let view = await render(BoardPage);
		await page.getByRole('textbox', { name: 'Puzzle words' }).fill(words.join('\n'));
		await page.getByRole('button', { name: 'Create board' }).click();
		for (const word of words.slice(0, 4)) {
			await page.getByRole('button', { name: word, exact: true }).click();
		}
		await page.getByRole('button', { name: 'Create Yellow group' }).click();
		await page.getByRole('button', { name: 'Change group to Blue' }).click();
		await page.getByRole('button', { name: 'WORD 5', exact: true }).click();
		await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
		const snapshot = stored();
		expect(snapshot.groups[0]).toEqual({ id: 1, color: 'blue', tiles: tiles.slice(0, 4) });
		expect(snapshot.selectedIds).toEqual([5]);
		expect(snapshot.nextGroupId).toBe(2);

		await view.unmount();
		view = await render(BoardPage);
		await expect
			.element(page.getByRole('button', { name: 'Change group to Blue' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'WORD 5', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(stored()).toEqual(snapshot);
		await page.getByRole('button', { name: 'Deselect all' }).click();
		expect(stored().selectedIds).toEqual([]);
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		expect(stored().groups).toEqual([]);
		expect(stored().tiles).toEqual([...tiles.slice(0, 4), ...snapshot.tiles]);

		await page.getByRole('button', { name: 'New board' }).click();
		await view.unmount();
		await render(BoardPage);
		await expect
			.element(page.getByRole('textbox', { name: 'Puzzle words' }))
			.toHaveValue(words.join('\n'));
		await expect.element(page.getByRole('button', { name: 'New board' })).not.toBeInTheDocument();
		expect(stored().groups).toEqual([]);
		expect(stored().tiles).toEqual([]);
	});

	it('restores a completed board', async () => {
		localStorage.setItem(
			BOARD_STORAGE_KEY,
			JSON.stringify({
				...saved,
				version: 1,
				tiles: [],
				selectedIds: [],
				nextGroupId: 5,
				groups: Array.from({ length: 4 }, (_, index) => ({
					id: index + 1,
					color: 'gray',
					tiles: tiles.slice(index * 4, index * 4 + 4)
				}))
			})
		);
		await render(BoardPage);
		await expect.element(page.getByRole('button', { name: 'New board' })).toBeVisible();
		expect(page.getByRole('button', { name: 'Undo', exact: true }).elements()).toHaveLength(4);
		await expect.element(page.getByRole('textbox')).not.toBeInTheDocument();
	});

	it('recovers from a corrupt save and keeps playing when writes are blocked', async () => {
		localStorage.setItem(BOARD_STORAGE_KEY, 'broken JSON');
		await render(BoardPage);
		await expect.element(page.getByRole('textbox', { name: 'Puzzle words' })).toBeVisible();
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('Storage blocked');
		});
		await page.getByRole('textbox', { name: 'Puzzle words' }).fill(words.join('\n'));
		await page.getByRole('button', { name: 'Create board' }).click();
		await page.getByRole('button', { name: 'WORD 1', exact: true }).click();
		await expect
			.element(page.getByRole('button', { name: 'WORD 1', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(
				page.getByText(
					'Your browser couldn’t save your progress. Keep this page open to avoid losing it.'
				)
			)
			.toBeVisible();
	});
});
