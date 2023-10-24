import colors from '../../iconkit/sacredtexts/colors.json' assert { type: "json" };
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";

/**
 * An entry for the in-game leaderboard.
 */
interface LeaderboardEntry {
	username: string;
	playerID: string;
	percent: number;
	date: string;
	rank: number;
	icon: {
		icon: number;
		col1: number;
		col2: number;
		form: string;
		glow: boolean;
		col1RGB: { r: number, g: number, b: number };
		col2RGB: { r: number, g: number, b: number };
	}
	coins: number;
	accountID: string;
}


export default async function(app: Express, req: Request, res: Response) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return sendError();

	let amount = 100;
	let count = req.query.count ? parseInt(req.query.count.toString()) : null;
	if (count && count > 0) {
		if (count > 200) amount = 200;
		else amount = count;
	}

	let params = {
		levelID: req.params.id,
		accountID: appRoutines.id,
		gjp: appRoutines.gjp, 
		type: req.query.hasOwnProperty("week") ? "2" : "1",
	};

	reqBundle.gdRequest('getGJLevelScores211', params, function(err, resp, body) { 
		if (err) return res.status(500).send({error: true, lastWorked: appRoutines.timeSince(reqBundle.id)});
		let scores = body?.split('|').map(rawScorePlayerEntry => appRoutines.parseResponse(rawScorePlayerEntry)).filter(rawScorePlayerEntry => rawScorePlayerEntry[1]) || [];
		if (!scores.length) return res.status(500).send([]);
		else appRoutines.trackSuccess(reqBundle.id);

		scores.forEach(playerEntry => {
			const score: LeaderboardEntry = {
				rank: +playerEntry[6],
				username: playerEntry[1],
				percent: +playerEntry[3],
				coins: +playerEntry[13],
				playerID: playerEntry[2],
				accountID: playerEntry[16],
				date: playerEntry[42] + reqBundle.timestampSuffix,
				icon: {
					form: ['icon', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'][+playerEntry[14]],
					icon: +playerEntry[9],
					col1: +playerEntry[10],
					col2: +playerEntry[11],
					glow: +playerEntry[15] > 1,
					col1RGB: colors[playerEntry[10]] || colors["0"],
					col2RGB: colors[playerEntry[11]] || colors["3"]
				}
			};
			appRoutines.userCache(reqBundle.id, score.accountID, score.playerID, score.username);
		}) 

		return res.send(scores.slice(0, amount));
	})
}