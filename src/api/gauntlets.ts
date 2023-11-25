import { IGauntletCacheItem, IGauntletEntry } from "../types/gauntlets.js";
import { ErrorCode, ExportBundle } from "../types/servers.js";
import { parseResponse } from "../lib/parseResponse.js";
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
 * @param api Whether this is an API request.
 * @returns A list of gauntlets in JSON.
 */
export default async function(req: Request, res: Response, cacheGauntlets: boolean, api: boolean = true) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");

	const cached = cache[reqBundle.id];
	if (cacheGauntlets && cached && cached.data && cached.indexed + 2000000 > Date.now()) {
		if (api) return res.send(cached.data); // half hour cache
		else return res.render("gauntlets", { gauntlets: cached.data });
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
		if (api) res.send(gauntletList);
		else res.render("gauntlets", { gauntlets: gauntletList });
	}
	catch (err) {
		return sendError(ErrorCode.SERVER_ISSUE, "Failed to fetch gauntlets upstream.");
	}
}