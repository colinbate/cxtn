import { env } from 'cloudflare:workers';
import { getConnectionsWords } from '#lib/server/connections.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const words = await getConnectionsWords(params.date, env.KV, fetch);
	return Response.json({ words });
};
