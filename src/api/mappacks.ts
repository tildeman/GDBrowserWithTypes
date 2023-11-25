import { IMapPackCacheItem, IMapPackEntry } from "../types/mappacks.js";
import { ErrorCode, ExportBundle } from "../types/servers.js";
import { parseResponse } from "../lib/parseResponse.js";
import { Request, Response } from "express";

/**
 * The map pack difficulties.
 */
const difficulties = [
	"auto", "easy", "normal", "hard", "harder",
	"insane", "demon", "demon-easy", "demon-medium",
	"demon-insane", "demon-extreme"
];
/**
 * The global cache object for map packs.
 */
const cache: Record<string, IMapPackCacheItem> = {};

/**
 * Return a list of available map packs.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param cacheMapPacks Whether to cache map packs.
 * @param api Whether this is an API request.
 * @returns A list of map packs in JSON.
 */
export default async function(req: Request, res: Response, cacheMapPacks: boolean, api: boolean = true) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");

	const cached = cache[reqBundle.id];
	if (cacheMapPacks && cached && cached.data && cached.indexed + 5000000 > Date.now()) {
		if (api) return res.send(cached.data); // 1.5 hour cache
		else return res.render("mappacks", { mappacks: cached.data });
	}
	const params = { count: 250, page: 0 };
	const packs: Record<number, string>[] = [];

	/**
	 * Loads map packs (possibly page-by-page), until all of them are collected.
	 */
	async function mapPackLoop() {
		try {
			const body = await reqBundle.gdRequest('getGJMapPacks21', params);
			
			const newPacks = body?.split('#')[0].split('|').map(mapPackResponse => parseResponse(mapPackResponse)).filter(mapPackResponse => mapPackResponse[2]) || [];
			packs.push(...newPacks);
			
			// not all GDPS'es support the count param, which means recursion time!!!
			if (newPacks.length == 10) {
				params.page++;
				return await mapPackLoop();
			}
			
			const mappacks: IMapPackEntry[] = packs.map(mapPackEntry => ({ // "packs.map()" laugh now please
				id: +mapPackEntry[1],
				name: mapPackEntry[2],
				levels: mapPackEntry[3].split(","),
				stars: +mapPackEntry[4],
				coins: +mapPackEntry[5],
				difficulty: difficulties[+mapPackEntry[6]] || "unrated",
				barColor: mapPackEntry[7],
				textColor: mapPackEntry[8]
			}));
			
			if (cacheMapPacks) {
				cache[reqBundle.id] = {
					data: mappacks,
					indexed: Date.now()
				};
			}
			if (api) return res.send(mappacks);
			else return res.render("mappacks", { mappacks });
		}
		catch (err) {
			return sendError(ErrorCode.SERVER_ISSUE, "Failed to fetch map packs upstream.");
		}
	}
	await mapPackLoop();
}