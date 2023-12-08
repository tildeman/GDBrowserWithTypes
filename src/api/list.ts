import { ErrorCode, ExportBundle } from "../types/servers.js";
import { parseResponse } from "../lib/parseResponse.js";
import { SearchQueryLevel } from "../classes/Level.js";
import { UserCache } from "../classes/UserCache.js";
import { LevelList } from "../types/lists.js";
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
 * Inspect a list's overview data.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param api Whether this is an API request.
 * @param userCacheHandle The user cache passed in by reference.
 * @returns If this is an API request, return the raw data in JSON. Else display it in a webpage.
 */
export default async function (req: Request, res: Response, api: boolean, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	/**
	 * If the list info is ill-formed, redirect the user to the search page.
	 * @param message The error message upon level rejection.
	 * @param errorCode The error code that comes with the error.
	 */
	function rejectList(message: string = "Problem found with an unknown cause", errorCode = ErrorCode.SERVER_ISSUE) {
		console.error(message);
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError(errorCode, message);
	}

	if (reqBundle.offline) return rejectList("The requested server is currently unavailable.", ErrorCode.SERVER_UNAVAILABLE);

	const listID = req.params.id.replace(/[^0-9]/g, "");

	try {
		const body = await reqBundle.gdRequest("getGJLevelLists", { str: listID, type: 0 });

		const rawData = body.split("#");
		const currentList = parseResponse(rawData[0]);
		const author = rawData[1].split(":");
		const levelList = currentList[51].split(",");
		if (author.length >= 3) userCacheHandle.userCache(reqBundle.id, author[2], author[0], author[1]);

		const listResponse: LevelList = {
			id: currentList[1],
			name: currentList[2],
			desc: Buffer.from((currentList[3] || ""), "base64").toString() || "(No description provided)",
			version: +currentList[5],
			accountID: currentList[49],
			username: currentList[50],
			downloads: +currentList[10],
			difficulty: +currentList[7],
			difficultyFace: `${(difficulties[+currentList[7]] || "unrated").toLowerCase().split(' ')[0]}${(+currentList[19]) ? '-featured' : ''}`,
			likes: +currentList[14],
			featured: +currentList[19] || 0,
			levels: levelList,
			uploaded: +currentList[28],
			updated: +currentList[29]
		};

		if (api) res.send(listResponse);
		else {
			const levelStr = await reqBundle.gdRequest("getGJLevels21", { str: currentList[51], type: 10 });
			const splitBody = levelStr?.split('#') || [];
			const preRes = splitBody[0].split('|');
			const authorList: Record<string, [string, string]> = {};
			const songList = {};
			const authors = splitBody[1].split('|');
			const songString = splitBody[2];
			const songs = songString.split('~:~').map(songResponse => parseResponse(`~${songResponse}~`, '~|~'));
			songs.forEach(songEntry => {
				songList[songEntry['~1']] = songEntry['2'];
			});

			authors.forEach(authorResponse => {
				if (authorResponse.startsWith('~')) throw new Error("Can't look up author data.");
				const arr = authorResponse.split(':');
				authorList[arr[0]] = [arr[1], arr[2]];
			});

			const levelArray = preRes.map(levelResponse => parseResponse(levelResponse)).filter(levelResponse => levelResponse[1]);
			const parsedLevels: SearchQueryLevel[] = [];

			levelArray.forEach((levelData, levelIndex) => {
				const songSearch = songs.find(songItem => songItem['~1'] == levelData[35]) || [];

				const level = new SearchQueryLevel(levelData, reqBundle.server, null, {});
				level.getSongInfo(songSearch);
				if (!level.id) throw new Error("The list includes levels without an ID.")
				level.author = authorList[levelData[6]] ? authorList[levelData[6]][0] : "-";
				level.accountID = authorList[levelData[6]] ? authorList[levelData[6]][1] : "0";

				if (level.author != "-") userCacheHandle.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

				parsedLevels[levelIndex] = level;
			});

			res.render("list", {
				levels: parsedLevels,
				list: listResponse
			});
		}
	}
	catch (err) {
		rejectList(err.message);
	}
}