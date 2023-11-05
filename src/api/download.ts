import { parseResponse } from "../lib/parse_response.js";
import { ExportBundle } from "../types.js";
import { DownloadedLevel } from '../classes/Level.js';
import { Request, Response } from "express";
import { UserCache } from "../classes/UserCache.js";
import analyzeController from "./analyze.js";
import request from 'axios';

/**
 * Download a level, and then inspect its data.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param api Whether this is an API request.
 * @param ID The ID of the level.
 * @param analyze Whether to analyze the level or look for metadata.
 * @param userCacheHandle The user cache passed in by reference.
 * @returns If this is an API request, return the raw data in JSON. Else display it in a webpage.
 */
export default async function(req: Request, res: Response, api: boolean, ID: string, analyze: boolean, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	/**
	 * If the level info is ill-formed, redirect the user to the search page.
	 */
	function rejectLevel() {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError();
	}

	let levelIDCode = ID || req.params.id, levelID: number;

	if (reqBundle.offline) {
		if (!api && +levelIDCode < 0) return res.redirect('/');
		return rejectLevel();
	}
	if (levelIDCode == "daily") levelID = -1;
	else if (levelIDCode == "weekly") levelID = -2;
	else levelID = +(levelIDCode.replace(/[^0-9]/g, ""));

	try {
		const body = await reqBundle.gdRequest('downloadGJLevel22', { levelID });

		let authorData = body.split("#")[3] || "";  // daily/weekly only, most likely

		const levelInfo = parseResponse(body || "");
		let level = new DownloadedLevel(levelInfo, reqBundle.server, true, {});
		if (!level.id) return rejectLevel();

		let foundID: string[] = userCacheHandle.accountCache[reqBundle.id][Object.keys(userCacheHandle.accountCache[reqBundle.id]).find(x => userCacheHandle.accountCache[reqBundle.id][x][1] == level.playerID) || ""];
		if (foundID) foundID = foundID.filter(x => x != level.playerID);

		// TODO: find a way to deal with this stack of four requests
		if (!authorData) {
			const b1 = await reqBundle.gdRequest('getGJUsers20', { str: level.playerID });
			const gdSearchResult = authorData ? "" : parseResponse(b1 || "");
			const b2 = await reqBundle.gdRequest('getGJUserInfo20', { targetAccountID: gdSearchResult[16] });
			const account = parseResponse(b2 || "");
			level.author = account[1] || "-";
			level.accountID = gdSearchResult[16] || "0";
		}

		if (foundID || authorData) {
			const authorInfo = foundID || authorData.split(":");
			level.author = authorInfo[1] || "-";
			level.accountID = authorInfo[0] && authorInfo[0].includes(",") ? "0" : authorInfo[0];
		}

		if (level.author != "-") {
			userCacheHandle.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);
		}

		const songRes = await reqBundle.gdRequest('getGJSongInfo', { songID: level.customSong });
		level = level.getSongInfo(parseResponse(songRes || "", '~|~') as any);
		level.extraString = levelInfo[36];
		level.data = levelInfo[4];
		if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;

		if (analyze) return analyzeController(req, res, level);

		/**
		 * If this is called as an API call, send the raw response.
		 * Else send the user-friendly interface.
		 * @returns An Express response, or void
		 */
		function sendLevel() {
			if (api) return res.send(level);
			res.render("level", { level });
		}

		if (levelID < 0) { // Level is a weekly or a daily
			const dailyInfo = await reqBundle.gdRequest('getGJDailyLevel', { weekly: levelID == -2 ? "1" : "0" });
			if (dailyInfo == "-1") return sendLevel();
			let dailyTime = dailyInfo?.split("|")[1] || "0";
			level.nextDaily = +dailyTime;
			level.nextDailyTimestamp = Math.round((Date.now() + (+dailyTime * 1000)) / 100000) * 100000;
			return sendLevel();
		}
		else if (reqBundle.server.demonList && level.difficulty == "Extreme Demon") {
			request.get(reqBundle.server.demonList + 'api/v2/demons/?name=' + level.name.trim()).then(function (resp) {
				let demonList: string = resp.data.toString();
				let demon: any[] = JSON.parse(demonList);
				if (demon[0] && demon[0].position) level.demonList = demon[0].position;
			}).finally(function() {
				return sendLevel();
			});
		}
		else return sendLevel();
		// reqBundle.gdRequest(authorData ? "" : 'getGJUsers20', { str: level.playerID }, function (err1, res1, b1) {
		// 	let gdSearchResult = authorData ? "" : parseResponse(b1 || "");
		// 	reqBundle.gdRequest(authorData ? "" : 'getGJUserInfo20', { targetAccountID: gdSearchResult[16] }, function (err2, res2, b2) {
		// 		if (err2 && (foundID || authorData)) {
		// 			let authorInfo = foundID || authorData.split(":");
		// 			level.author = authorInfo[1] || "-";
		// 			level.accountID = authorInfo[0] && authorInfo[0].includes(",") ? "0" : authorInfo[0];
		// 		}

		// 		else if (!err && b2 != '-1') {
		// 			let account = parseResponse(b2 || "");
		// 			level.author = account[1] || "-";
		// 			level.accountID = gdSearchResult[16];
		// 		}

		// 		else {
		// 			level.author = "-";
		// 			level.accountID = "0";
		// 		}

		// 		if (level.author != "-") userCacheHandle.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

		// 		reqBundle.gdRequest('getGJSongInfo', { songID: level.customSong }, function (err, resp, songRes) {

		// 			level = level.getSongInfo(parseResponse(songRes || "", '~|~') as any); // TODO: use a better type
		// 			level.extraString = levelInfo[36];
		// 			level.data = levelInfo[4];
		// 			if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;

		// 			if (analyze) return analyzeController(req, res, level);

		// 			/**
		// 			 * If this is called as an API call, send the raw response.
		// 			 * Else send the user-friendly interface.
		// 			 * @returns An Express response, or void
		// 			 */
		// 			function sendLevel() {
		// 				if (api) return res.send(level);
		// 				res.render("level", { level });
		// 			}

		// 			if (levelID < 0) {
		// 				reqBundle.gdRequest('getGJDailyLevel', { weekly: levelID == -2 ? "1" : "0" }, function (err, resp, dailyInfo) {
		// 					if (err || dailyInfo == "-1") return sendLevel();
		// 					let dailyTime = dailyInfo?.split("|")[1] || "0";
		// 					level.nextDaily = +dailyTime;
		// 					level.nextDailyTimestamp = Math.round((Date.now() + (+dailyTime * 1000)) / 100000) * 100000;
		// 					return sendLevel();
		// 				})  ;
		// 			}

		// 			else if (reqBundle.server.demonList && level.difficulty == "Extreme Demon") {
		// 				request.get(reqBundle.server.demonList + 'api/v2/demons/?name=' + level.name.trim()).then(function (resp) {
		// 					let demonList: string = resp.data.toString();
		// 					let demon: any[] = JSON.parse(demonList);
		// 					if (demon[0] && demon[0].position) level.demonList = demon[0].position;
		// 				}).finally(function() {
		// 					return sendLevel();
		// 				});
		// 			}
		// 			else return sendLevel();
		// 		});
		// 	});
		// });
	}
	catch (err) {
		if (analyze && api && reqBundle.server.downloadsDisabled) return res.status(403).send("-3");
		else if (!api && levelID < 0) return res.redirect(`/?daily=${levelID * -1}`);
		else return rejectLevel();
	}
}