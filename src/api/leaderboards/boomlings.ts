import { IBoomlingsUser } from "../../types/leaderboards.js";
import { ExportBundle } from "../../types/servers.js";
import { Request, Response } from "express";
import request from "axios";

// Note: As Boomlings has been discontinued for a long time, the servers went offline sometime around 2018.
// The code here is largely untested and will definitely fail, but may prove helpful (who knows?)

/**
 * Fetch data for the (now offline) Boomlings leaderboard.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param secret The key that is sent to RobTop's servers for every request.
 * @returns The response of the leaderboard in JSON.
 */
export default async function(req: Request, res: Response, secret?: string) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;

	// Accurate leaderboard returns 418 because Private servers do not use.
	if (reqBundle.isGDPS) return res.status(418).send("0");

	request.post('http://robtopgames.com/Boomlings/get_scores.php', {
		secret: secret || "Wmfd2893gb7",
		name: "Player"
	}).then(function(resp) {
		const body = resp.data;
		if (!body || body == 0) return res.status(500).send("0");
		// let info = body.split(" ").filter(infoText => infoText.includes(";"));
		const strBody: string = body;
		const info = strBody.split(" ").filter(infoText => infoText.includes(";"));
		const users: IBoomlingsUser[] = [];
		info.forEach((item, index) => {
			const userRaw = item.split(";");
			const scores = userRaw[2];
			const visuals = userRaw[3];
			const user: IBoomlingsUser = {
				rank: index + 1,
				name: userRaw[0],
				ID: userRaw[1],
				level: +scores.slice(1, 3),
				score: +scores.slice(3, 10),
				boomling: +visuals.slice(5, 7),
				boomlingLevel: +visuals.slice(2, 4),
				powerups: [+visuals.slice(7, 9), +visuals.slice(9, 11), +visuals.slice(11, 13)].map(item  => (item > 8 || item < 1) ? 0 : item),

				unknownVisual: +visuals.slice(0, 2),
				unknownScore: +scores.slice(0, 1),
				raw: item
			};

			if (!user.boomling || user.boomling > 66 || user.boomling < 0) user.boomling = 0;
			if (!user.boomlingLevel || user.boomlingLevel > 25 || user.boomlingLevel < 1) user.boomlingLevel = 25;

			users.push(user);
		})

		return res.send(users);
	});
}