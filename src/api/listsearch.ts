import { ErrorCode, ExportBundle } from "../types/servers.js";
import { IListSearchFilters } from "../types/searches.js";
import { SearchQueryLevelList } from "../types/lists.js";
import { parseResponse } from "../lib/parseResponse.js";
import { UserCache } from "../classes/UserCache.js";
import { Request, Response } from "express";

/**
 * The list difficulties.
 */
const difficulties = [
	"auto", "easy", "normal", "hard", "harder",
	"insane", "demon", "demon-easy", "demon-medium",
	"demon-insane", "demon-extreme"
];

/**
 * Search for lists from given filters.
 * @param req The client request.
 * @param res The server response (to send the list details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns A list of levels in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) {
		if (req.query.hasOwnProperty("err")) res.status(500).send("err");
		else sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");
	}


	const count = reqBundle.isGDPS ? 10 : +(req.query.count || 0);
	const amount = (count && count > 0) ? Math.min(count, 500) : 10;

	const filters: IListSearchFilters = {
		str: req.params.text,

		page: Number(req.query.page) || 0,

		featured: req.query.hasOwnProperty("featured") ? 1 : 0,
		star: req.query.hasOwnProperty("starred") ? 1 : 0,

		type: Number(req.query.type) || 0,
		count: amount,
	}
	if (req.query.diff) filters.diff = req.query.diff.toString();
	if (req.query.creators) filters.followed = req.query.creators.toString();


	if (req.query.type) {
		const filterCheck = req.query.type.toString().toLowerCase();
		switch(filterCheck) {
			case 'mostdownloaded': filters.type = 1; break;
			case 'mostliked': filters.type = 2; break;
			case 'recent': filters.type = 4; break;
			case 'featured': filters.type = 6; break;
		}
	}

	if (req.query.hasOwnProperty("creators")) filters.type = 12;

	if (filters.str == "*") delete filters.str;
	try {
		const body = await reqBundle.gdRequest('getGJLevelLists', reqBundle.gdParams({ ...filters }));
		const splitBody = body?.split('#') || [];
		const preRes = splitBody[0].split('|');
		const authorList: Record<string, [string ,string]> = {};
		const authors = splitBody[1].split('|');

		authors.forEach(authorResponse => {
			if (authorResponse.startsWith('~')) throw new Error("Can't look up author data.");
			let arr = authorResponse.split(':');
			authorList[arr[2]] = [arr[1], arr[0]];
		});

		const listArray = preRes
			.map(listResponse => parseResponse(listResponse))
			.filter(listResponse => listResponse[1]);
		const parsedLists: SearchQueryLevelList[] = [];

		listArray.forEach((listData, listIndex) => {
			const list: SearchQueryLevelList = {
				id: listData[1],
				name: listData[2],
				desc: Buffer.from((listData[3] || ""), "base64").toString() || "(No description provided)",
				version: +listData[5],
				accountID: listData[49],
				playerID: authorList[listData[49]][1],
				username: listData[50],
				downloads: +listData[10],
				difficulty: +listData[7],
				difficultyFace: difficulties[+listData[7]] || "unrated",
				likes: +listData[14],
				featured: +listData[19] || 0,
				levels: listData[51].split(","),
				uploaded: +listData[28],
				updated: +listData[29]
			}
			if (!list.id) throw new Error("The search query included lists without an ID.");

			if (list.username != "-") userCacheHandle.userCache(reqBundle.id, list.accountID.toString(), list.playerID.toString(), list.username);

			//this is broken if you're not on page 0, blame robtop
			if (filters.page == 0 && listIndex == 0 && splitBody[2]) {
				const pages = splitBody[2].split(":");

				// normal page stuff
				list.results = +pages[0];
				list.pages = +pages[0] == 9999 ? 1000 : +Math.ceil(+pages[0] / amount);
			}

			parsedLists[listIndex] = list;
		});

		return res.send(parsedLists);
	}
	catch (err) {
		return sendError(ErrorCode.SERVER_ISSUE, err.message);
	}
}