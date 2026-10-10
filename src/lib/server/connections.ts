import { error } from '@sveltejs/kit';

export interface PuzzleCache {
	get(key: string): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
}

export function isPuzzleDate(date: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
	const parsed = new Date(`${date}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function puzzleWords(raw: string, date: string): string[] | null {
	let puzzle: unknown;
	try {
		puzzle = JSON.parse(raw);
	} catch {
		return null;
	}
	if (
		!isRecord(puzzle) ||
		puzzle.status !== 'OK' ||
		puzzle.print_date !== date ||
		!Array.isArray(puzzle.categories) ||
		puzzle.categories.length !== 4
	) {
		return null;
	}

	const cards: { content: string; position: number }[] = [];
	for (const category of puzzle.categories) {
		if (!isRecord(category) || !Array.isArray(category.cards) || category.cards.length !== 4) {
			return null;
		}
		for (const card of category.cards) {
			if (
				!isRecord(card) ||
				typeof card.content !== 'string' ||
				!card.content.trim() ||
				typeof card.position !== 'number' ||
				!Number.isInteger(card.position) ||
				card.position < 0 ||
				card.position > 15
			) {
				return null;
			}
			cards.push({ content: card.content, position: card.position });
		}
	}
	if (new Set(cards.map((card) => card.position)).size !== 16) return null;
	// NYT returns cards grouped by solution. Restore their original board positions.
	return cards.sort((a, b) => a.position - b.position).map((card) => card.content);
}

export async function getConnectionsWords(
	date: string,
	cache: PuzzleCache | undefined,
	fetchPuzzle: typeof fetch
): Promise<string[]> {
	if (!isPuzzleDate(date)) error(400, 'Use a valid date in YYYY-MM-DD format.');
	if (!cache) error(503, 'Puzzle storage is unavailable. Please try again later.');

	const key = `connections:${date}`;
	let cached: string | null;
	try {
		cached = await cache.get(key);
	} catch {
		error(503, 'Puzzle storage is unavailable. Please try again later.');
	}
	if (cached !== null) {
		const words = puzzleWords(cached, date);
		if (words) return words;
	}

	let response: Response;
	try {
		response = await fetchPuzzle(`https://www.nytimes.com/svc/connections/v2/${date}.json`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(10_000)
		});
	} catch {
		error(502, 'Could not reach the puzzle provider. Please try again.');
	}
	if (response.status === 404) error(404, 'No Connections puzzle is available for this date yet.');
	if (!response.ok) error(502, 'Could not load the puzzle from its provider. Please try again.');

	let raw: string;
	try {
		raw = await response.text();
	} catch {
		error(502, 'Could not read the puzzle response. Please try again.');
	}
	const words = puzzleWords(raw, date);
	if (!words) error(502, 'The puzzle provider returned an unexpected response. Please try again.');

	try {
		// Retain the complete response, including solutions, without an expiration.
		await cache.put(key, raw);
	} catch {
		error(503, 'Could not save the puzzle. Please try again later.');
	}
	return words;
}
