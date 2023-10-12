import { Player } from "../../classes/Player.js";
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";

interface ScoreParameters {
	count: number;
	type: "top" | "creators" | "week" | "relative";
	accountID?: string;
}

// module.exports = async (app, req, res) => {
export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
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

		if (["creators", "creator", "cp"].some(x => req.query.hasOwnProperty(x) || req.query.type == x)) {
			params.type = "creators";
		}
		else if (["week", "weekly"].some(x => req.query.hasOwnProperty(x) || req.query.type == x)) {
			params.type = "week";
		}
		else if (["global", "relative"].some(x => req.query.hasOwnProperty(x) || req.query.type == x)) {
			params.type = "relative";
			params.accountID = req.query.accountID?.toString() || "";
		}

		reqBundle.gdRequest('getGJScores20', params, function(err, resp, body) { 
			if (err) return sendError();
			let scoresArr = body?.split('|').map(x => appRoutines.parseResponse(x)).filter(x => x[1]) || [];
			if (!scoresArr.length) return sendError();

			// TODO: use a better type
			let scores = scoresArr.map(x => new Player(x as any));
			scores.forEach(x => appRoutines.userCache(reqBundle.id, x.accountID, x.playerID, x.username)) ;
			return res.send(scores.slice(0, amount));
		})
}