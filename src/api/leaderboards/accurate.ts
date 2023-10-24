import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import secret_stuff from "../../../src/misc/secretStuff.json" assert { type: "json" };

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

let indexes = ["stars", "coins", "demons", "diamonds"];

let forms = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
let lastIndex = [{"stars": 0, "coins": 0, "demons": 0}, {"stars": 0, "coins": 0, "demons": 0, "diamonds": 0}];
let caches = [
	{"stars": null, "coins": null, "demons": null, "diamonds": null},
	{"stars": null, "coins": null, "demons": null, "diamonds": null},
	{"stars": null, "coins": null, "demons": null, "diamonds": null}
]; // 0 for JSON, 1 for mods, 2 for GD

// module.exports = async (app, req, res, post) => {
export default async function(app: Express, req: Request, res: Response, api: boolean, ID: string, analyze: boolean) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	// Annotation: 418 actually means "I'm a teapot" in the Hypertext Coffee Protocol, which is a 1998 April Fools RFC (?).
	// Accurate leaderboard returns 418 because private servers do not use.
	if (reqBundle.isGDPS) return res.status(418).send("-2");
	if (!appRoutines.sheetsKey) return res.status(500).send([]);
	let post = null; // Something's wrong with Colon
	let gdMode = post || req.query.hasOwnProperty("gd");
	let modMode = !gdMode && req.query.hasOwnProperty("mod");
	let cache = caches[gdMode ? 2 : modMode ? 1 : 0];

	let type = req.query.type ? req.query.type.toString().toLowerCase() : 'stars';
	if (type == "usercoins") type = "coins";
	if (!indexes.includes(type)) type = "stars";
	if (lastIndex[modMode ? 1 : 0][type] + 600000 > Date.now() && cache[type]) {
		return res.send(gdMode ? cache[type] : JSON.parse(cache[type])); // 10 min cache
	}

	sheet.loadInfo().then(async () => {
		let tab = sheet.sheetsById[1555821000];
		await tab.loadCells('A2:H2');

		let cellIndex = indexes.findIndex(x => type == x);
		if (modMode) cellIndex += indexes.length;

		let cell = tab.getCell(1, cellIndex).value;
		if (!cell || typeof cell != "string" || cell.startsWith("GoogleSpreadsheetFormulaError")) {
			console.log("Spreadsheet Error:");
			console.log(cell);
			return sendError();
		}
		let leaderboard: LeaderboardEntry[] = JSON.parse(cell.replace(/~( |$)/g, ""));

		let gdFormatting = "";
		leaderboard.forEach(x => {
			appRoutines.userCache(reqBundle.id, x.accountID, x.playerID, x.username);
			gdFormatting += `1:${x.username}:2:${x.playerID}:13:${x.coins}:17:${x.usercoins}:6:${x.rank}:9:${x.icon.icon}:10:${x.icon.col1}:11:${x.icon.col2}:14:${forms.indexOf(x.icon.form)}:15:${x.icon.glow ? 2 : 0}:16:${x.accountID}:3:${x.stars}:8:${x.cp}:46:${x.diamonds}:4:${x.demons}|`;
		});
		caches[modMode ? 1 : 0][type] = JSON.stringify(leaderboard);
		caches[2][type] = gdFormatting;
		lastIndex[modMode ? 1 : 0][type] = Date.now();
		return res.send(gdMode ? gdFormatting : leaderboard);
	});
}