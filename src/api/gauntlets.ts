import { IGauntletCacheItem, IGauntletEntry } from "../types/gauntlets.js";
import { parseResponse } from "../lib/parseResponse.js";
import { ExportBundle } from "../types/servers.js";
import { Request, Response } from "express";

/**
 * The global cache object for gauntlets.
 */
const cache: Record<string, IGauntletCacheItem> = {};
/**
 * The gauntlet names as of update 2.11.
 */
const gauntletNames = [
	"Fire", "Ice", "Poison", "Shadow",
	"Lava", "Bonus", "Chaos", "Demon",
	"Time", "Crystal", "Magic", "Spike",
	"Monster", "Doom", "Death"
];

/**
 * Return a list of available gauntlets.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param cacheMapPacks Whether to cache gauntlets.
 * @returns A list of gauntlets in JSON.
 */
export default async function(req: Request, res: Response, cacheGauntlets: boolean) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError();

	const cached = cache[reqBundle.id];
	if (cacheGauntlets && cached && cached.data && cached.indexed + 2000000 > Date.now()) {
		return res.send(cached.data); // half hour cache
	}

	try {
		const body = await reqBundle.gdRequest('getGJGauntlets21', {});

		const gauntlets = body.split('#')[0].split('|').map(gauntletResponse => parseResponse(gauntletResponse)).filter(gauntletResponse => gauntletResponse[3]) || [];
		const gauntletList: IGauntletEntry[] = gauntlets.map((gauntletItem) => ({
			id: +gauntletItem[1],
			name: gauntletNames[+gauntletItem[1] - 1] || "Unknown",
			levels: gauntletItem[3].split(",")
		}));

		if (cacheGauntlets) cache[reqBundle.id] = {
			data: gauntletList,
			indexed: Date.now()
		};
		res.send(gauntletList);
	}
	catch (err) {
		return sendError();
	}
}