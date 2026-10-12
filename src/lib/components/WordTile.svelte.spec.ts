import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WordTile from './WordTile.svelte';

afterEach(() => {
	vi.restoreAllMocks();
});

function pointer(button: Element, type: string, overrides: PointerEventInit = {}) {
	button.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId: 1,
			pointerType: 'touch',
			isPrimary: true,
			button: 0,
			clientX: 30,
			clientY: 30,
			...overrides
		})
	);
}

describe('word lookup', () => {
	it('selects on a normal click and opens a safely encoded search on Shift-click', async () => {
		const onselect = vi.fn();
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		await render(WordTile, { label: 'ROCK & ROLL', onselect });
		const tile = page.getByRole('button', { name: 'ROCK & ROLL', exact: true });

		await tile.click();
		await tile.click({ modifiers: ['Shift'] });

		expect(onselect).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledExactlyOnceWith(
			'https://www.google.com/search?q=ROCK%20%26%20ROLL%20meaning',
			'_blank',
			'noopener,noreferrer'
		);
	});

	it('offers a lookup link on long press without selecting the tile or opening a popup', async () => {
		const onselect = vi.fn();
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		await render(WordTile, { label: 'QUANDARY', onselect });
		const tile = page.getByRole('button', { name: 'QUANDARY', exact: true }).element();
		pointer(tile, 'pointerdown');
		await expect.element(page.getByRole('dialog', { name: 'QUANDARY' })).toBeVisible();
		pointer(tile, 'pointerup');
		tile.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));

		await expect.element(page.getByRole('dialog', { name: 'QUANDARY' })).toBeVisible();
		const link = page.getByRole('link', { name: /Look up meaning/ });
		await expect
			.element(link)
			.toHaveAttribute('href', 'https://www.google.com/search?q=QUANDARY%20meaning');
		await expect.element(link).toHaveAttribute('target', '_blank');
		expect(onselect).not.toHaveBeenCalled();
		expect(open).not.toHaveBeenCalled();

		await page.getByRole('button', { name: 'Close', exact: true }).click();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'QUANDARY', exact: true }).click();
		expect(onselect).toHaveBeenCalledTimes(1);
	});

	it.each(['pointerup', 'pointercancel', 'pointerleave', 'pointermove'])(
		'cancels a pending lookup on %s',
		async (event) => {
			await render(WordTile, { label: 'QUANDARY', onselect: vi.fn() });
			const tile = page.getByRole('button', { name: 'QUANDARY', exact: true }).element();
			pointer(tile, 'pointerdown');
			pointer(tile, event, { clientY: 60 });
			await new Promise((resolve) => setTimeout(resolve, 650));

			await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		}
	);

	it('keeps lookup available when selection is disabled and supports keyboard dismissal', async () => {
		const onselect = vi.fn();
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		await render(WordTile, { label: 'QUANDARY', disabled: true, onselect });
		const tile = page.getByRole('button', { name: 'QUANDARY', exact: true }).element();
		tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		tile.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
		expect(onselect).not.toHaveBeenCalled();
		expect(open).toHaveBeenCalledTimes(1);

		const lookup = page.getByRole('button', { name: 'Look up the meaning of QUANDARY' });
		await lookup.click();
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(lookup).toHaveFocus();
	});

	it('clears the hold timer when the tile is removed', async () => {
		const view = await render(WordTile, { label: 'QUANDARY', onselect: vi.fn() });
		const tile = page.getByRole('button', { name: 'QUANDARY', exact: true }).element();
		const clearTimer = vi.spyOn(window, 'clearTimeout');
		pointer(tile, 'pointerdown');
		clearTimer.mockClear();
		await view.unmount();
		expect(clearTimer).toHaveBeenCalledTimes(1);
	});
});
