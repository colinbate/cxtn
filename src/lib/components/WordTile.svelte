<script lang="ts">
	import { onDestroy } from 'svelte';

	let {
		label,
		selected = false,
		disabled = false,
		onselect
	}: {
		label: string;
		selected?: boolean;
		disabled?: boolean;
		onselect: () => void;
	} = $props();

	const id = $props.id();
	let lookupOpen = $state(false);
	let lookupUrl = $derived(
		`https://www.google.com/search?q=${encodeURIComponent(`${label} meaning`)}`
	);
	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let activePointer: number | undefined;
	let startX = 0;
	let startY = 0;
	let suppressClick = false;

	function cancelPress() {
		clearTimeout(pressTimer);
		pressTimer = undefined;
		activePointer = undefined;
	}

	function startPress(event: PointerEvent) {
		cancelPress();
		if (!event.isPrimary || event.button !== 0) return;
		suppressClick = false;
		if (event.shiftKey) return;
		activePointer = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		pressTimer = setTimeout(() => {
			suppressClick = true;
			cancelPress();
			lookupOpen = true;
		}, 550);
	}

	function movePress(event: PointerEvent) {
		if (
			event.pointerId === activePointer &&
			Math.hypot(event.clientX - startX, event.clientY - startY) > 10
		) {
			cancelPress();
		}
	}

	function select(event: MouseEvent) {
		if (suppressClick && event.detail > 0) {
			suppressClick = false;
			return;
		}
		suppressClick = false;
		if (event.shiftKey) {
			window.open(lookupUrl, '_blank', 'noopener,noreferrer');
			return;
		}
		if (!disabled) onselect();
	}

	function showLookup(dialog: HTMLDialogElement) {
		dialog.showModal();
		return () => dialog.close();
	}

	onDestroy(cancelPress);
</script>

<div class="relative min-w-0">
	<button
		type="button"
		onclick={select}
		onpointerdown={startPress}
		onpointermove={movePress}
		onpointerup={cancelPress}
		onpointercancel={cancelPress}
		onpointerleave={cancelPress}
		oncontextmenu={(event) => event.preventDefault()}
		aria-disabled={disabled}
		aria-pressed={selected}
		title="Shift-click or press and hold to look up the meaning"
		class={[
			'group relative flex h-full min-h-24 w-full touch-pan-y items-center justify-center rounded-xl border px-3 pt-6 pb-11 text-center text-sm leading-tight font-extrabold tracking-[0.015em] uppercase transition duration-150 select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e] sm:min-h-28 sm:px-4 sm:text-base',
			selected
				? '-translate-y-0.5 border-[#24221e] bg-[#24221e] text-white shadow-[0_6px_0_#cbc6bb]'
				: 'border-[#d7d2c8] bg-[#ece9e2] text-[#282621] hover:-translate-y-0.5 hover:border-[#aaa49a] hover:bg-white hover:shadow-[0_5px_0_#ddd8ce]',
			disabled &&
				'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[#d7d2c8] hover:bg-[#ece9e2] hover:shadow-none'
		]}
	>
		<span class="max-w-full break-words">{label}</span>
		<span
			class={[
				'absolute top-2 right-2 flex size-4 items-center justify-center rounded-full border transition',
				selected
					? 'border-white/60 bg-white text-[#24221e]'
					: 'border-[#beb9af] bg-transparent text-transparent'
			]}
			aria-hidden="true"
		>
			<svg viewBox="0 0 12 12" class="size-2.5" fill="none" stroke="currentColor" stroke-width="2"
				><path d="m2 6 2.5 2.5L10 3" /></svg
			>
		</span>
	</button>
	<button
		type="button"
		onclick={() => (lookupOpen = true)}
		aria-label={`Look up the meaning of ${label}`}
		aria-haspopup="dialog"
		title="Look up meaning"
		class={[
			'absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]',
			selected ? 'text-white/70 hover:text-white' : 'text-[#625e55] hover:text-[#211f1b]'
		]}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			class="size-4"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
		>
			<circle cx="10.5" cy="10.5" r="6.5" />
			<path d="m16 16 5 5" />
		</svg>
	</button>
</div>

{#if lookupOpen}
	<dialog
		{@attach showLookup}
		onclose={() => (lookupOpen = false)}
		aria-labelledby={`${id}-lookup-title`}
		class="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#d7d2c8] bg-[#f7f5f0] p-6 text-[#211f1b] shadow-xl backdrop:bg-black/35"
	>
		<h2 id={`${id}-lookup-title`} class="text-xl font-bold break-words">{label}</h2>
		<p class="mt-2 text-sm text-[#625e55]">Search Google for this word’s meaning.</p>
		<div class="mt-6 flex flex-wrap items-center gap-3">
			<a
				href={lookupUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-full bg-[#24221e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3b3933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]"
			>
				Look up meaning <span aria-hidden="true">↗</span>
				<span class="sr-only">(opens in a new tab)</span>
			</a>
			<form method="dialog">
				<button
					type="submit"
					class="rounded-full px-4 py-3 text-sm font-semibold hover:bg-[#ece9e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24221e]"
					>Close</button
				>
			</form>
		</div>
	</dialog>
{/if}
