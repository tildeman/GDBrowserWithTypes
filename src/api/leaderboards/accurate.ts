import secret_stuff from "../../misc/secretStuff.json" assert { type: "json" };
import { AccurateLeaderboardEntry } from "../../types/leaderboards.js";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { ExportBundle } from "../../types/servers.js";
import { UserCache } from "../../classes/UserCache.js";
import { Request, Response } from "express";

const sheet = new GoogleSpreadsheet('1ADIJvAkL0XHGBDhO7PP9aQOuK3mPIKB2cVPbshuBBHc', { apiKey: secret_stuff.sheetsKey }); // accurate leaderboard spreadsheet

const indices = ["stars", "coins", "demons", "diamonds"];

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
	if (!indices.includes(type)) type = "stars";
	if (lastIndex[modMode ? 1 : 0][type] + 600000 > Date.now() && cache[type]) {
		return res.send(gdMode ? cache[type] : JSON.parse(cache[type])); // 10 min cache
	}

	sheet.loadInfo().then(async () => {
		const tab = sheet.sheetsById[1555821000];
		await tab.loadCells('A2:H2');

		let cellIndex = indices.findIndex(index => type == index);
		if (modMode) cellIndex += indices.length;

		const cell = tab.getCell(1, cellIndex).value;
		if (!cell || typeof cell != "string" || cell.startsWith("GoogleSpreadsheetFormulaError")) {
			console.log("Spreadsheet Error:");
			console.log(cell);
			return sendError();
		}
		const leaderboard: AccurateLeaderboardEntry[] = JSON.parse(cell.replace(/~( |$)/g, ""));

		let gdFormatting = "";
		leaderboard.forEach(entry => {
			userCacheHandle.userCache(reqBundle.id, entry.accountID, entry.playerID, entry.username);
			gdFormatting += `1:${entry.username}:2:${entry.playerID}:13:${entry.coins}:17:${entry.usercoins}:6:${entry.rank}:9:${entry.icon.icon}:10:${entry.icon.col1}:11:${entry.icon.col2}:14:${forms.indexOf(entry.icon.form)}:15:${entry.icon.glow ? 2 : 0}:16:${entry.accountID}:3:${entry.stars}:8:${entry.cp}:46:${entry.diamonds}:4:${entry.demons}|`;
		});
		caches[modMode ? 1 : 0][type] = JSON.stringify(leaderboard);
		caches[2][type] = gdFormatting;
		lastIndex[modMode ? 1 : 0][type] = Date.now();
		return res.send(gdMode ? gdFormatting : leaderboard);
	});
}