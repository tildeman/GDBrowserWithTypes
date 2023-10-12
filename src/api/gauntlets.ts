import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";

let cache = {};
let gauntletNames = [
	"Fire", "Ice", "Poison", "Shadow",
	"Lava", "Bonus", "Chaos", "Demon",
	"Time", "Crystal", "Magic", "Spike",
	"Monster", "Doom", "Death"
];

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return sendError();

	let cached = cache[reqBundle.id];
	if (appRoutines.config.cacheGauntlets && cached && cached.data && cached.indexed + 2000000 > Date.now()) {
		return res.send(cached.data); // half hour cache}
	}

	reqBundle.gdRequest('getGJGauntlets21', {}, function (err, resp, body) {

		if (err) return sendError();
		let gauntlets = body?.split('#')[0].split('|').map(x => appRoutines.parseResponse(x)).filter(x => x[3]) || [];
		let gauntletList = gauntlets.map(x => ({ id: +x[1], name: gauntletNames[+x[1] - 1] || "Unknown", levels: x[3].split(",") }));

		if (appRoutines.config.cacheGauntlets) cache[reqBundle.id] = {
			data: gauntletList,
			indexed: Date.now()
		};
		res.send(gauntletList);
	});
}