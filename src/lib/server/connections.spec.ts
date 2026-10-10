import { describe, expect, it, vi } from 'vitest';
import { getConnectionsWords } from './connections.js';

const date = '2026-10-10';
const puzzle = {
	status: 'OK',
	id: 1318,
	print_date: date,
	editor: 'Editor',
	categories: Array.from({ length: 4 }, (_, group) => ({
		title: `Solution ${group}`,
		cards: Array.from({ length: 4 }, (_, index) => ({
			content: `WORD ${index * 4 + group}`,
			position: index * 4 + group
		}))
	})),
	stream: 'daily'
};
const raw = JSON.stringify(puzzle);
const words = Array.from({ length: 16 }, (_, index) => `WORD ${index}`);

function setup(cached: string | null = null) {
	const cache = {
		get: vi.fn<(key: string) => Promise<string | null>>().mockResolvedValue(cached),
		put: vi.fn<(key: string, value: string) => Promise<void>>().mockResolvedValue(undefined)
	};
	const fetchPuzzle = vi.fn<typeof fetch>().mockResolvedValue(new Response(raw));
	return { cache, fetchPuzzle };
}

describe('Connections word cache', () => {
	it('stores the full response and returns words in board order without solutions', async () => {
		const { cache, fetchPuzzle } = setup();
		expect(await getConnectionsWords(date, cache, fetchPuzzle)).toEqual(words);
		expect(cache.get).toHaveBeenCalledWith(`connections:${date}`);
		expect(fetchPuzzle).toHaveBeenCalledWith(
			`https://www.nytimes.com/svc/connections/v2/${date}.json`,
			expect.objectContaining({ headers: { Accept: 'application/json' } })
		);
		expect(cache.put).toHaveBeenCalledExactlyOnceWith(`connections:${date}`, raw);
	});

	it('serves cached puzzles without another fetch or write', async () => {
		const { cache, fetchPuzzle } = setup(raw);
		expect(await getConnectionsWords(date, cache, fetchPuzzle)).toEqual(words);
		expect(fetchPuzzle).not.toHaveBeenCalled();
		expect(cache.put).not.toHaveBeenCalled();
	});

	it.each(['2026-02-30', '2026-13-01', '2026-1-01', 'today', '../other'])(
		'rejects invalid date %s before any I/O',
		async (invalidDate) => {
			const { cache, fetchPuzzle } = setup();
			await expect(getConnectionsWords(invalidDate, cache, fetchPuzzle)).rejects.toMatchObject({
				status: 400
			});
			expect(cache.get).not.toHaveBeenCalled();
			expect(fetchPuzzle).not.toHaveBeenCalled();
		}
	);

	it.each(['not json', JSON.stringify({ ...puzzle, print_date: '2026-10-09' })])(
		'repairs unusable cached data',
		async (cached) => {
			const { cache, fetchPuzzle } = setup(cached);
			expect(await getConnectionsWords(date, cache, fetchPuzzle)).toEqual(words);
			expect(fetchPuzzle).toHaveBeenCalledOnce();
			expect(cache.put).toHaveBeenCalledWith(`connections:${date}`, raw);
		}
	);

	it.each([404, 403, 500])('does not cache an upstream HTTP %s error', async (status) => {
		const { cache, fetchPuzzle } = setup();
		fetchPuzzle.mockResolvedValue(new Response('unavailable', { status }));
		await expect(getConnectionsWords(date, cache, fetchPuzzle)).rejects.toMatchObject({
			status: status === 404 ? 404 : 502
		});
		expect(cache.put).not.toHaveBeenCalled();
	});

	it('handles a network failure without caching it', async () => {
		const { cache, fetchPuzzle } = setup();
		fetchPuzzle.mockRejectedValue(new TypeError('Network failure'));
		await expect(getConnectionsWords(date, cache, fetchPuzzle)).rejects.toMatchObject({
			status: 502
		});
		expect(cache.put).not.toHaveBeenCalled();
	});

	it.each([
		'not json',
		JSON.stringify({ ...puzzle, print_date: '2026-10-09' }),
		JSON.stringify({ ...puzzle, categories: puzzle.categories.slice(0, 3) }),
		JSON.stringify({
			...puzzle,
			categories: puzzle.categories.map((category) => ({
				...category,
				cards: category.cards.map((card) => ({ ...card, position: 0 }))
			}))
		})
	])('rejects malformed or mismatched upstream puzzles', async (body) => {
		const { cache, fetchPuzzle } = setup();
		fetchPuzzle.mockResolvedValue(new Response(body));
		await expect(getConnectionsWords(date, cache, fetchPuzzle)).rejects.toMatchObject({
			status: 502
		});
		expect(cache.put).not.toHaveBeenCalled();
	});

	it('reports a missing binding without fetching', async () => {
		const { fetchPuzzle } = setup();
		await expect(getConnectionsWords(date, undefined, fetchPuzzle)).rejects.toMatchObject({
			status: 503
		});
		expect(fetchPuzzle).not.toHaveBeenCalled();
	});

	it('reports a cache read failure without fetching', async () => {
		const { cache, fetchPuzzle } = setup();
		cache.get.mockRejectedValue(new Error('Storage failure'));
		await expect(getConnectionsWords(date, cache, fetchPuzzle)).rejects.toMatchObject({
			status: 503
		});
		expect(fetchPuzzle).not.toHaveBeenCalled();
	});

	it('reports a cache write failure', async () => {
		const { cache, fetchPuzzle } = setup();
		cache.put.mockRejectedValue(new Error('Storage failure'));
		await expect(getConnectionsWords(date, cache, fetchPuzzle)).rejects.toMatchObject({
			status: 503
		});
	});
});
