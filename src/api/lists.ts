import { parseResponse } from "../lib/parseResponse.js";
import { UserCache } from "../classes/UserCache.js";
import { ExportBundle } from "../types/servers.js";
import { ListResponse } from "../types/lists.js";
import { Request, Response } from "express";

export default async function (req: Request, res: Response, api: boolean, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	/**
	 * If the list info is ill-formed, redirect the user to the search page.
	 * @param [message="Problem found with an unknown cause"] The error message upon level rejection.
	 * @param [errorCode=2] The error code that comes with the error.
	 */
	function rejectList(message: string = "Problem found with an unknown cause", errorCode = 2) {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError(errorCode, message);
	}

	if (reqBundle.offline) return rejectList("The requested server is currently unavailable.", 1);

	const listID = req.params.id.replace(/[^0-9]/g, "");

	try {
		const body = await reqBundle.gdRequest("getGJLevelLists", { str: listID, type: 0 });

		const rawData = body.split("#");
		const currentList = parseResponse(rawData[0]);
		const author = rawData[1].split(":");
		console.log(author);
		const levelList = currentList[51].split(",");
		// if (author.length) userCacheHandle.userCache(reqBundle.id, author[0], author[1], author[2]);

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
			levels: levelList,
			uploaded: +currentList[28],
			updated: +currentList[29]
		};

		if (api) res.send(listResponse);
		else {
		}
	}
	catch {
		rejectList("The list cannot be retrieved.");
	}
}