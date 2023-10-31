import colors from '../../iconkit/sacredtexts/colors.json' assert { type: "json" };
import secret_stuff from "../../misc/secretStuff.json" assert { type: "json" };
import { parseResponse } from '../../lib/parse_response.js';
import { UserCache } from '../../classes/UserCache.js';
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { XOR } from '../../lib/xor.js';

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


/**
 * Fetch data for the level leaderboard.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The response of the level leaderboard in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError();

	let amount = 100;
	const count = req.query.count ? parseInt(req.query.count.toString()) : null;
	if (count && count > 0) {
		if (count > 200) amount = 200;
		else amount = count;
	}

	const params = {
		levelID: req.params.id,
		accountID: secret_stuff.id,
		gjp: secret_stuff.gjp || XOR.encrypt(secret_stuff.password),
		type: req.query.hasOwnProperty("week") ? "2" : "1",
	};

	reqBundle.gdRequest('getGJLevelScores211', params, function(err, resp, body) {
		if (err) return res.status(500).send({ error: true, lastWorked: userCacheHandle.timeSince(reqBundle.id) });
		const rawScores = body?.split('|').map(rawScorePlayerEntry => parseResponse(rawScorePlayerEntry)).filter(rawScorePlayerEntry => rawScorePlayerEntry[1]) || [];
		const scores: LeaderboardEntry[] = [];
		if (!rawScores.length) return res.status(500).send([]);
		else userCacheHandle.trackSuccess(reqBundle.id);

		rawScores.forEach(playerEntry => {
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
			scores.push(score);
			userCacheHandle.userCache(reqBundle.id, score.accountID, score.playerID, score.username);
		});

		return res.send(scores.slice(0, amount));
	});
}