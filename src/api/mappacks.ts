import { IMapPackCacheItem, IMapPackEntry } from "../types/mappacks.js";
import { parseResponse } from "../lib/parseResponse.js";
import { ExportBundle } from "../types/servers.js";
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
 * @returns A list of map packs in JSON.
 */
export default async function(req: Request, res: Response, cacheMapPacks: boolean) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError();

	let cached = cache[reqBundle.id];
	if (cacheMapPacks && cached && cached.data && cached.indexed + 5000000 > Date.now()) {
		return res.send(cached.data); // 1.5 hour cache
	}
	const params = { count: 250, page: 0 };
	let packs: Record<number, string>[] = [];

	/**
	 * Loads map packs (possibly page-by-page), until all of them are collected.
	 */
	async function mapPackLoop() {
		try {
			const body = await reqBundle.gdRequest('getGJMapPacks21', params);
			
			const newPacks = body?.split('#')[0].split('|').map(mapPackResponse => parseResponse(mapPackResponse)).filter(mapPackResponse => mapPackResponse[2]) || [];
			packs = packs.concat(newPacks);
			
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
			return res.send(mappacks);
		}
		catch (err) {
			return sendError();
		}
	}
	await mapPackLoop();
}