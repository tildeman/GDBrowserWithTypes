import { Player } from "../../classes/Player.js";
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";

/**
 * Leaderboard parameters.
 */
interface ScoreParameters {
	/**
	 * The amount of entries in the leaderboard.
	 */
	count: number;
	/**
	 * The type of the leaderboard.
	 */
	type: "top" | "creators" | "week" | "relative";
	/**
	 * The account ID used for the leaderboard.
	 */
	accountID?: string;
}

export default async function(app: Express, req: Request, res: Response) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return sendError();

	let amount = 100;
	let count = req.query.count ? parseInt(req.query.count.toString() || "0") : null;
	if (count && count > 0) {
		if (count > 10000) amount = 10000;
		else amount = count;
	}

	let params: ScoreParameters = {
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

	reqBundle.gdRequest('getGJScores20', params, function(err, resp, body) { 
		if (err) return sendError();
		let scoresArr = body?.split('|').map(rawScorePlayerEntry => appRoutines.parseResponse(rawScorePlayerEntry)).filter(rawScorePlayerEntry => rawScorePlayerEntry[1]) || [];
		if (!scoresArr.length) return sendError();

		let scores = scoresArr.map(scorePlayerEntry => new Player(scorePlayerEntry));
		scores.forEach(playerEntry => appRoutines.userCache(reqBundle.id, playerEntry.accountID, playerEntry.playerID, playerEntry.username));
		return res.send(scores.slice(0, amount));
	});
}