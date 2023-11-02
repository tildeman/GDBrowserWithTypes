import { Request, Response } from "express";
import { ExportBundle } from "../../types.js";
import request from "axios";

/**
 * An object for a user in Boomlings, RobTop's discontinued game.
 */
interface BoomlingsUser {
    rank: number;
    name: string;
    ID: string;
    level: number;
    score: number;
    boomling: number;
    boomlingLevel: number;
    powerups: number[];
    unknownVisual: number;
    unknownScore: number;
    raw: string;
}

export default async function(req: Request, res: Response, secret?: string) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;

	// Accurate leaderboard returns 418 because Private servers do not use.
	if (reqBundle.isGDPS) return res.status(418).send("0");

	request.post('http://robtopgames.com/Boomlings/get_scores.php', {
		secret: secret || "Wmfd2893gb7",
		name: "Player"
	}).then(function(resp) {
		let body = resp.data;
		if (!body || body == 0) return res.status(500).send("0");
		// let info = body.split(" ").filter(infoText => infoText.includes(";"));
		let strBody: string = body;
		let info = strBody.split(" ").filter(infoText => infoText.includes(";"));
		let users: BoomlingsUser[] = [];
		info.forEach((item, index) => {
			let userRaw = item.split(";");
			let scores = userRaw[2];
			let visuals = userRaw[3];
			let user: BoomlingsUser = {
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