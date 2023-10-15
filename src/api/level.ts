import request from 'axios'; // I hope this doesn't cause too much trouble
import fs from 'fs';
import { Level, SearchQueryLevel } from '../classes/Level.js';
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";

export default async function(app: Express, req: Request, res: Response, api: boolean, analyze: boolean) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	function rejectLevel() {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError();
	}

	if (reqBundle.offline) return rejectLevel();

	let levelID = req.params.id;
	if (levelID == "daily") return appRoutines.run.download(app, req, res, api, 'daily', analyze);
	else if (levelID == "weekly") return appRoutines.run.download(app, req, res, api, 'weekly', analyze);
	else if (levelID.match(/[^0-9]/)) return rejectLevel();
	else levelID = levelID.replace(/[^0-9]/g, "");

	if (analyze || req.query.hasOwnProperty("download")) return appRoutines.run.download(app, req, res, api, levelID, analyze);

	reqBundle.gdRequest('getGJLevels21', { str: levelID, type: 0 }, async function (err, resp, body) {
		if (err || body?.startsWith("##")) return rejectLevel();
		body = body || "";

		let preRes = body.split('#')[0].split('|', 10);
		let author = body.split('#')[1].split('|')[0].split(':');
		let songStr = '~' + body.split('#')[2];
		let song = appRoutines.parseResponse(songStr, '~|~');

		let levelInfo = appRoutines.parseResponse(preRes.find(x => x.startsWith(`1:${levelID}`)) || preRes[0]);
		let level = new SearchQueryLevel(levelInfo, reqBundle.server, false, ["", author[1] || "", (+author[2] || 0).toString()]).getSongInfo(song);
		if (!level.id) return rejectLevel();

		if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;
		if (level.author != "-") appRoutines.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

		function sendLevel() {

			if (api) return res.send(level);

			else return fs.readFile('./html/level.html', 'utf8', function (err, data) {
				let html = data;
				let filteredSong = level.songName.replace(/[^ -~]/g, "");  // strip off unsupported characters
				level.songName = filteredSong || level.songName;
				let variables = Object.keys(level);
				variables.forEach(x => {
					console.log(x);
					console.log(appRoutines.clean(level[x]));
					let regex = new RegExp(`\\[\\[${x.toUpperCase()}\\]\\]`, "g");
					html = html.replace(regex, appRoutines.clean(level[x]));
				})
				if (reqBundle.server.downloadsDisabled) {
					html = html.replace('id="additional" class="', 'id="additional" class="downloadDisabled ')
						.replace('analyzeBtn"', 'analyzeBtn" style="filter: opacity(30%)"');
				}
				return res.send(html);
			});
		}

		if (reqBundle.server.demonList && level.difficulty == "Extreme Demon") {
			try {
				const demon = (await request.get(reqBundle.server.demonList + 'api/v2/demons/?name=' + level.name.trim())).data;
				if (demon[0] && demon[0].position) level.demonList = demon[0].position;
			}
			catch (err) {}
		}
		return sendLevel();
	});
}
