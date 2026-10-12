import type { Group, Tile } from './connection-types.js';

export const BOARD_STORAGE_KEY = 'connection-board';

export type BoardState = {
	entryText: string;
	tiles: Tile[];
	selectedIds: number[];
	groups: Group[];
	nextGroupId: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTile(value: unknown): value is Tile {
	return (
		isRecord(value) && isId(value.id) && typeof value.label === 'string' && !!value.label.trim()
	);
}

function isGroup(value: unknown): value is Group {
	return (
		isRecord(value) &&
		isId(value.id) &&
		typeof value.color === 'string' &&
		['yellow', 'green', 'blue', 'purple', 'gray'].includes(value.color) &&
		Array.isArray(value.tiles) &&
		value.tiles.length === 4 &&
		value.tiles.every(isTile)
	);
}

function isSavedBoard(value: unknown): value is BoardState & { version: 1 } {
	if (
		!isRecord(value) ||
		value.version !== 1 ||
		typeof value.entryText !== 'string' ||
		!Array.isArray(value.tiles) ||
		!value.tiles.every(isTile) ||
		!Array.isArray(value.groups) ||
		!value.groups.every(isGroup) ||
		!Array.isArray(value.selectedIds) ||
		!value.selectedIds.every(isId) ||
		value.selectedIds.length > 4 ||
		!isId(value.nextGroupId)
	) {
		return false;
	}

	const allTiles = [...value.tiles, ...value.groups.flatMap((group) => group.tiles)];
	const tileIds = new Set(allTiles.map((tile) => tile.id));
	const remainingIds = new Set(value.tiles.map((tile) => tile.id));
	const groupIds = new Set(value.groups.map((group) => group.id));
	const nextGroupId = value.nextGroupId;
	return (
		(allTiles.length === 0 || allTiles.length === 16) &&
		tileIds.size === allTiles.length &&
		groupIds.size === value.groups.length &&
		value.groups.every((group) => group.id < nextGroupId) &&
		new Set(value.selectedIds).size === value.selectedIds.length &&
		value.selectedIds.every((id) => remainingIds.has(id))
	);
}

export function loadSavedBoard(): BoardState | null {
	try {
		const stored = localStorage.getItem(BOARD_STORAGE_KEY);
		if (!stored) return null;
		const board: unknown = JSON.parse(stored);
		return isSavedBoard(board) ? board : null;
	} catch {
		// Unavailable storage or an invalid save must not prevent using the board.
		return null;
	}
}

export function saveBoard(board: BoardState): boolean {
	try {
		if (!board.entryText && board.tiles.length === 0 && board.groups.length === 0) {
			localStorage.removeItem(BOARD_STORAGE_KEY);
		} else {
			localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify({ ...board, version: 1 }));
		}
		return true;
	} catch {
		return false;
	}
}
