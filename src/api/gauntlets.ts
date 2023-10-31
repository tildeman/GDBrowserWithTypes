import { parseResponse } from "../lib/parse_response.js";
import { Request, Response } from "express";
import { ExportBundle } from "../types.js";

/**
 * An entry for a Geometry Dash gauntlet.
 */
interface GauntletEntry {
    id: number;
    name: string;
    levels: string[];
}

/**
 * The cache object for gauntlets on any GDPS.
 */
interface GauntletCacheItem {
	data: GauntletEntry[];
	indexed: number;
}

/**
 * The global cache object for gauntlets.
 */
let cache: Record<string, GauntletCacheItem> = {};
/**
 * The gauntlet names as of update 2.11.
 */
let gauntletNames = [
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

	let cached = cache[reqBundle.id];
	if (cacheGauntlets && cached && cached.data && cached.indexed + 2000000 > Date.now()) {
		return res.send(cached.data); // half hour cache
	}

	reqBundle.gdRequest('getGJGauntlets21', {}, function (err, resp, body) {

		if (err) return sendError();
		let gauntlets = body?.split('#')[0].split('|').map(gauntletResponse => parseResponse(gauntletResponse)).filter(gauntletResponse => gauntletResponse[3]) || [];
		let gauntletList: GauntletEntry[] = gauntlets.map((gauntletItem) => ({
			id: +gauntletItem[1],
			name: gauntletNames[+gauntletItem[1] - 1] || "Unknown",
			levels: gauntletItem[3].split(",")
		}));

		if (cacheGauntlets) cache[reqBundle.id] = {
			data: gauntletList,
			indexed: Date.now()
		};
		res.send(gauntletList);
	});
}