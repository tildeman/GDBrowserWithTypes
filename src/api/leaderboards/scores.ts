import { IScoreParameters } from "../../types/leaderboards.js";
import { ErrorCode, ExportBundle } from "../../types/servers.js";
import { parseResponse } from "../../lib/parseResponse.js";
import { UserCache } from "../../classes/UserCache.js";
import { Player } from "../../classes/Player.js";
import { Request, Response } from "express";
/**
 * Fetch data for the in-game leaderboard.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The response of the leaderboard in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");

	const count = req.query.count ? parseInt(req.query.count.toString() || "0") : null;
	const amount = (count && count > 0) ? Math.min(count, 10000) : 100;

	const params: IScoreParameters = {
		count: amount,
		type: "top"
	};

	if (["creators", "creator", "cp"].some(creatorProperty => req.query.hasOwnProperty(creatorProperty) || req.query.type == creatorProperty)) {
		params.type = "creators";
	}
	else if (["week", "weekly"].some(weeklyProperty => req.query.hasOwnProperty(weeklyProperty) || req.query.type == weeklyProperty)) {
		params.type = "week";
	}
	else if (["global", "relative"].some(miscProperty => req.query.hasOwnProperty(miscProperty) || req.query.type == miscProperty)) {
		params.type = "relative";
		params.accountID = req.query.accountID?.toString() || "";
	}

	try {
		const body = await reqBundle.gdRequest('getGJScores20', params);
		const scoresArr = body?.split('|').map(rawScorePlayerEntry => parseResponse(rawScorePlayerEntry)).filter(rawScorePlayerEntry => rawScorePlayerEntry[1]) || [];
		if (!scoresArr.length) throw new Error("Can't search for scores upstream.");

		const scores = scoresArr.map(scorePlayerEntry => new Player(scorePlayerEntry));
		scores.forEach(playerEntry => userCacheHandle.userCache(reqBundle.id, playerEntry.accountID, playerEntry.playerID, playerEntry.username));
		return res.send(scores.slice(0, amount));
	}
	catch (err) {
		return sendError(ErrorCode.SERVER_ISSUE, err.message);
	}
}