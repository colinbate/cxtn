import { describe, expect, it } from 'vitest';
import { localPuzzleDate } from './puzzle-date.js';
import { isPuzzleDate } from './server/connections.js';

describe('puzzle dates', () => {
	it('uses local calendar fields even when the UTC date is different', () => {
		const date = new Date('2026-10-11T02:30:00Z');
		expect(localPuzzleDate(date)).toBe('2026-10-10');
	});

	it('pads month and day', () => {
		expect(localPuzzleDate(new Date(2026, 0, 2))).toBe('2026-01-02');
	});

	it('validates leap days', () => {
		expect(isPuzzleDate('2028-02-29')).toBe(true);
		expect(isPuzzleDate('2026-02-29')).toBe(false);
	});
});
