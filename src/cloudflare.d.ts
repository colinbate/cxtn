declare module 'cloudflare:workers' {
	export const env: {
		KV: import('#lib/server/connections.js').PuzzleCache;
	};
}
