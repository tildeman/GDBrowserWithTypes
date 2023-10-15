import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";

let difficulties = [
	"auto", "easy", "normal", "hard", "harder",
	"insane", "demon", "demon-easy", "demon-medium",
	"demon-insane", "demon-extreme"
];
let cache = {};

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return sendError();
	
	let cached = cache[reqBundle.id];
	if (appRoutines.config.cacheMapPacks && cached && cached.data && cached.indexed + 5000000 > Date.now()) {
		return res.send(cached.data); // 1.5 hour cache
	}
	let params = { count: 250, page: 0 };
	let packs: Record<number, string>[] = [];

	function mapPackLoop() {
		reqBundle.gdRequest('getGJMapPacks21', params, function (err, resp, body) {

			if (err) return sendError();

			let newPacks = body?.split('#')[0].split('|').map(mapPackResponse => appRoutines.parseResponse(mapPackResponse)).filter(mapPackResponse => mapPackResponse[2]) || [];
			packs = packs.concat(newPacks);

			// not all GDPS'es support the count param, which means recursion time!!!
			if (newPacks.length == 10) {
				params.page++;
				return mapPackLoop();
			}
			
			let mappacks = packs.map(mapPackEntry => ({ // "packs.map()" laugh now please
				id: +mapPackEntry[1],
				name: mapPackEntry[2],
				levels: mapPackEntry[3].split(","),
				stars: +mapPackEntry[4],
				coins: +mapPackEntry[5],
				difficulty: difficulties[+mapPackEntry[6]] || "unrated",
				barColor: mapPackEntry[7],
				textColor: mapPackEntry[8]
			}));

			if (appRoutines.config.cacheMapPacks) cache[reqBundle.id] = {
				data: mappacks,
				indexed: Date.now()
			};
			return res.send(mappacks);
		})
	}
	mapPackLoop();
}