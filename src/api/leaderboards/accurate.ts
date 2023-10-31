import secret_stuff from "../../misc/secretStuff.json" assert { type: "json" };
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { UserCache } from "../../classes/UserCache";
import { Request, Response } from "express";
import { ExportBundle } from "../../types";

/**
 * An entry for the accurate leaderboard.
 */
interface LeaderboardEntry {
	username: string;
	playerID: string;
	stars: number;
	demons: number;
	rank: number;
	cp: number;
	icon: {
		icon: number;
		col1: number;
		col2: number;
		form: string;
		glow: boolean;
	}
	coins: number;
	accountID: string;
	usercoins: number;
	diamonds: number;
}

const sheet = new GoogleSpreadsheet('1ADIJvAkL0XHGBDhO7PP9aQOuK3mPIKB2cVPbshuBBHc', { apiKey: secret_stuff.sheetsKey }); // accurate leaderboard spreadsheet

const indexes = ["stars", "coins", "demons", "diamonds"];

const forms = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
const lastIndex = [{"stars": 0, "coins": 0, "demons": 0}, {"stars": 0, "coins": 0, "demons": 0, "diamonds": 0}];
const caches = [
	{"stars": null, "coins": null, "demons": null, "diamonds": null},
	{"stars": null, "coins": null, "demons": null, "diamonds": null},
	{"stars": null, "coins": null, "demons": null, "diamonds": null}
]; // 0 for JSON, 1 for mods, 2 for GD

/**
 * Fetch data for the accurate leaderboard.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @param post If enabled, return the raw response. Else, return the formatted JSON.
 * @returns The response of the accurate leaderboard in JSON or raw (depending on `post`).
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache, post?: boolean) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	// Annotation: 418 actually means "I'm a teapot" in the Hypertext Coffee Protocol, which is a 1998 April Fools RFC (?).
	// Accurate leaderboard returns 418 because private servers do not use.
	if (reqBundle.isGDPS) return res.status(418).send("-2");
	if (!secret_stuff.sheetsKey) return res.status(500).send([]);
	const gdMode = post || req.query.hasOwnProperty("gd");
	const modMode = !gdMode && req.query.hasOwnProperty("mod");
	const cache = caches[gdMode ? 2 : modMode ? 1 : 0];

	let type = req.query.type ? req.query.type.toString().toLowerCase() : 'stars';
	if (type == "usercoins") type = "coins";
	if (!indexes.includes(type)) type = "stars";
	if (lastIndex[modMode ? 1 : 0][type] + 600000 > Date.now() && cache[type]) {
		return res.send(gdMode ? cache[type] : JSON.parse(cache[type])); // 10 min cache
	}

	sheet.loadInfo().then(async () => {
		const tab = sheet.sheetsById[1555821000];
		await tab.loadCells('A2:H2');

		let cellIndex = indexes.findIndex(x => type == x);
		if (modMode) cellIndex += indexes.length;

		const cell = tab.getCell(1, cellIndex).value;
		if (!cell || typeof cell != "string" || cell.startsWith("GoogleSpreadsheetFormulaError")) {
			console.log("Spreadsheet Error:");
			console.log(cell);
			return sendError();
		}
		const leaderboard: LeaderboardEntry[] = JSON.parse(cell.replace(/~( |$)/g, ""));

		let gdFormatting = "";
		leaderboard.forEach(x => {
			userCacheHandle.userCache(reqBundle.id, x.accountID, x.playerID, x.username);
			gdFormatting += `1:${x.username}:2:${x.playerID}:13:${x.coins}:17:${x.usercoins}:6:${x.rank}:9:${x.icon.icon}:10:${x.icon.col1}:11:${x.icon.col2}:14:${forms.indexOf(x.icon.form)}:15:${x.icon.glow ? 2 : 0}:16:${x.accountID}:3:${x.stars}:8:${x.cp}:46:${x.diamonds}:4:${x.demons}|`;
		});
		caches[modMode ? 1 : 0][type] = JSON.stringify(leaderboard);
		caches[2][type] = gdFormatting;
		lastIndex[modMode ? 1 : 0][type] = Date.now();
		return res.send(gdMode ? gdFormatting : leaderboard);
	});
}