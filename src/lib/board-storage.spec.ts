import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOARD_STORAGE_KEY, loadSavedBoard, saveBoard, type BoardState } from './board-storage.js';

const tiles = Array.from({ length: 16 }, (_, index) => ({
	id: index + 1,
	label: `WORD ${index + 1}`
}));
const board: BoardState = {
	entryText: tiles.map((tile) => tile.label).join('\n'),
	tiles: tiles.slice(4).reverse(),
	selectedIds: [16, 8],
	groups: [{ id: 2, color: 'green', tiles: tiles.slice(0, 4) }],
	nextGroupId: 4
};

beforeEach(() => {
	const data = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: vi.fn((key: string) => data.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => data.set(key, value)),
		removeItem: vi.fn((key: string) => data.delete(key))
	});
});

afterEach(() => vi.unstubAllGlobals());

describe('saved boards', () => {
	it('restores word order, selection, group colors, and the next group ID', () => {
		expect(saveBoard(board)).toBe(true);
		expect(loadSavedBoard()).toEqual({ ...board, version: 1 });
	});

	it('accepts a finished board with all sixteen words grouped', () => {
		const complete: BoardState = {
			...board,
			tiles: [],
			selectedIds: [],
			groups: Array.from({ length: 4 }, (_, index) => ({
				id: index + 1,
				color: 'yellow',
				tiles: tiles.slice(index * 4, index * 4 + 4)
			})),
			nextGroupId: 5
		};
		saveBoard(complete);
		expect(loadSavedBoard()).toEqual({ ...complete, version: 1 });
	});

	it('keeps an unfinished word-entry draft and removes a completely empty save', () => {
		const draft = {
			entryText: 'APPLE\nPEAR',
			tiles: [],
			groups: [],
			selectedIds: [],
			nextGroupId: 1
		};
		saveBoard(draft);
		expect(loadSavedBoard()).toEqual({ ...draft, version: 1 });
		saveBoard({ ...draft, entryText: '' });
		expect(localStorage.getItem(BOARD_STORAGE_KEY)).toBeNull();
	});

	it.each([
		['malformed JSON', '{'],
		['null', 'null'],
		['unsupported version', JSON.stringify({ ...board, version: 2 })],
		['missing fields', JSON.stringify({ version: 1 })],
		[
			'unknown group color',
			JSON.stringify({ ...board, version: 1, groups: [{ ...board.groups[0], color: 'red' }] })
		],
		[
			'non-string color',
			JSON.stringify({ ...board, version: 1, groups: [{ ...board.groups[0], color: ['green'] }] })
		],
		[
			'wrong group size',
			JSON.stringify({
				...board,
				version: 1,
				groups: [{ ...board.groups[0], tiles: tiles.slice(0, 3) }]
			})
		],
		['missing word', JSON.stringify({ ...board, version: 1, tiles: board.tiles.slice(1) })],
		[
			'duplicate word ID',
			JSON.stringify({ ...board, version: 1, tiles: [...board.tiles.slice(1), tiles[0]] })
		],
		[
			'blank label',
			JSON.stringify({
				...board,
				version: 1,
				tiles: [{ ...board.tiles[0], label: ' ' }, ...board.tiles.slice(1)]
			})
		],
		['selected grouped word', JSON.stringify({ ...board, version: 1, selectedIds: [1] })],
		['duplicate selection', JSON.stringify({ ...board, version: 1, selectedIds: [8, 8] })],
		[
			'too many selected words',
			JSON.stringify({ ...board, version: 1, selectedIds: [5, 6, 7, 8, 9] })
		],
		['reused next group ID', JSON.stringify({ ...board, version: 1, nextGroupId: 2 })]
	])('ignores a save with %s', (_name, stored) => {
		localStorage.setItem(BOARD_STORAGE_KEY, stored);
		expect(loadSavedBoard()).toBeNull();
	});

	it('handles missing or inaccessible storage without throwing', () => {
		expect(loadSavedBoard()).toBeNull();
		vi.stubGlobal('localStorage', undefined);
		expect(loadSavedBoard()).toBeNull();
		expect(saveBoard(board)).toBe(false);
	});

	it('reports a failed write without replacing an existing save', () => {
		saveBoard(board);
		vi.mocked(localStorage.setItem).mockImplementation(() => {
			throw new Error('Quota exceeded');
		});
		expect(saveBoard({ ...board, selectedIds: [] })).toBe(false);
		expect(loadSavedBoard()?.selectedIds).toEqual([16, 8]);
	});
});
