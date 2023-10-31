import { parseResponse } from '../lib/parse_response.js';
import { SearchQueryLevel } from '../classes/Level.js';
import { UserCache } from '../classes/UserCache.js';
import downloadController from "./download.js";
import { Request, Response } from "express";
import { ExportBundle } from "../types.js";
import request from 'axios'; // I hope this doesn't cause too much trouble

/**
 * Inspect a level's overview data.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param api Whether this is an API request.
 * @param analyze Whether to analyze the level or look for metadata.
 * @param userCacheHandle The user cache passed by reference.
 * @returns If this is an API request, return the raw data in JSON. Else display it in a webpage.
 */
export default async function(req: Request, res: Response, api: boolean, analyze: boolean, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	/**
	 * If the level info is ill-formed, redirect the user to the search page.
	 */
	function rejectLevel() {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError();
	}

	if (reqBundle.offline) return rejectLevel();

	let levelID = req.params.id;
	if (levelID == "daily") return downloadController(req, res, api, 'daily', analyze, userCacheHandle);
	else if (levelID == "weekly") return downloadController(req, res, api, 'weekly', analyze, userCacheHandle);
	else if (levelID.match(/[^0-9]/)) return rejectLevel();
	else levelID = levelID.replace(/[^0-9]/g, "");

	if (analyze || req.query.hasOwnProperty("download")) return downloadController(req, res, api, levelID, analyze, userCacheHandle);

	reqBundle.gdRequest('getGJLevels21', { str: levelID, type: 0 }, async function (err, resp, body) {
		if (err || body?.startsWith("##")) return rejectLevel();
		body = body || "";

		const preRes = body.split('#')[0].split('|', 10);
		const author = body.split('#')[1].split('|')[0].split(':');
		const songStr = '~' + body.split('#')[2];
		const song = parseResponse(songStr, '~|~');

		const levelInfo = parseResponse(preRes.find(x => x.startsWith(`1:${levelID}`)) || preRes[0]);
		const level = new SearchQueryLevel(levelInfo, reqBundle.server, false, ["", author[1] || "", (+author[2] || 0).toString()]).getSongInfo(song);
		if (!level.id) return rejectLevel();

		if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;
		if (level.author != "-") userCacheHandle.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

		/**
		 * Send an appropriate response based on the method of the request.
		 * @returns If the request is an API call, return the raw object in JSON. Else, display the level info page.
		 */
		function sendLevel() {
			if (api) return res.send(level);

			const filteredSong = level.songName.replace(/[^ -~]/g, "");  // strip off unsupported characters
			level.songName = filteredSong || level.songName;
			res.render("level", {
				level,
				isDownloadDisabled: reqBundle.server.downloadsDisabled
			});
		}

		if (reqBundle.server.demonList && level.difficulty == "Extreme Demon") {
			try {
				const demon = (await request.get(reqBundle.server.demonList + 'api/v2/demons/?name=' + level.name.trim())).data;
				if (demon[0] && demon[0].position) level.demonList = demon[0].position;
			}
			catch (err) {
				console.error(err);
			}
		}
		return sendLevel();
	});
}
