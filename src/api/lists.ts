import { parseResponse } from "../lib/parseResponse.js";
import { UserCache } from "../classes/UserCache.js";
import { ExportBundle } from "../types/servers.js";
import { ListResponse } from "../types/lists.js";
import { Request, Response } from "express";

export default async function (req: Request, res: Response, api: boolean, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError();

	/**
	 * If the level info is ill-formed, redirect the user to the search page.
	 */
	function rejectLevel() {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError();
	}

	if (reqBundle.offline) return rejectLevel();

	let listID = req.params.id.replace(/[^0-9]/g, "");

	try {
		const body = await reqBundle.gdRequest("getGJLevelLists", { str: listID, type: 0 });

		const rawData = body.split("#");
		const currentList = parseResponse(rawData[0]);
		const author = rawData[1].split(":");

		const listResponse: ListResponse = {
			id: currentList[1],
			name: currentList[2],
			desc: Buffer.from((currentList[3] || ""), "base64").toString() || "(No description provided)",
			version: +currentList[5],
			accountID: currentList[49],
			username: currentList[50],
			downloads: +currentList[10],
			difficulty: +currentList[7],
			likes: +currentList[14],
			featured: +currentList[19] || 0,
			levels: currentList[51].split(","),
			uploaded: +currentList[28],
			updated: +currentList[29]
		};
		res.send(listResponse);
	}
	catch {
		rejectLevel();
	}
}