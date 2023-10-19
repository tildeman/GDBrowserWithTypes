import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";
import { DownloadedLevel, Level } from '../classes/Level.js';
import request from 'axios';
import fs from 'fs';

export default async function(app: Express, req: Request, res: Response, api: boolean, ID: string, analyze: boolean) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	function rejectLevel() {
		if (!api) return res.redirect('search/' + req.params.id);
		else return sendError();
	}
	
	let levelIDCode = ID || req.params.id, levelID: number;

	if (reqBundle.offline) {
		if (!api && +levelIDCode < 0) return res.redirect('/');
		return rejectLevel();
	}
	if (levelIDCode == "daily") levelID = -1;
	else if (levelIDCode == "weekly") levelID = -2;
	else levelID = +(levelIDCode.replace(/[^0-9]/g, ""));

	reqBundle.gdRequest('downloadGJLevel22', { levelID }, function (err, resp, body) {

		if (err) {
			if (analyze && api && reqBundle.server.downloadsDisabled) return res.status(403).send("-3");
			else if (!api && levelID < 0) return res.redirect(`/?daily=${levelID * -1}`);
			else return rejectLevel();
		}

		let authorData = body?.split("#")[3] || "";  // daily/weekly only, most likely

		let levelInfo = appRoutines.parseResponse(body || "");
		let level = new DownloadedLevel(levelInfo, reqBundle.server, true, {});
		if (!level.id) return rejectLevel();

		let foundID = appRoutines.accountCache[reqBundle.id][Object.keys(appRoutines.accountCache[reqBundle.id]).find(x => appRoutines.accountCache[reqBundle.id][x][1] == level.playerID) || ""];
		if (foundID) foundID = foundID.filter(x => x != level.playerID);

		// TODO: find a way to deal with this stack of four requests
		reqBundle.gdRequest(authorData ? "" : 'getGJUsers20', { str: level.playerID }, function (err1, res1, b1) {
			let gdSearchResult = authorData ? "" : appRoutines.parseResponse(b1 || "");
			reqBundle.gdRequest(authorData ? "" : 'getGJUserInfo20', { targetAccountID: gdSearchResult[16] }, function (err2, res2, b2) {
				if (err2 && (foundID || authorData)) {
					let authorInfo = foundID || authorData.split(":");
					level.author = authorInfo[1] || "-";
					level.accountID = authorInfo[0] && authorInfo[0].includes(",") ? "0" : authorInfo[0];
				}

				else if (!err && b2 != '-1') {
					let account = appRoutines.parseResponse(b2 || "");
					level.author = account[1] || "-";
					level.accountID = +gdSearchResult[16];
				}

				else {
					level.author = "-";
					level.accountID = 0;
				}

				if (level.author != "-") appRoutines.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

				reqBundle.gdRequest('getGJSongInfo', { songID: level.customSong }, function (err, resp, songRes) {

					level = level.getSongInfo(appRoutines.parseResponse(songRes || "", '~|~') as any); // TODO: use a better type
					level.extraString = levelInfo[36];
					level.data = levelInfo[4];
					if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;

					if (analyze) return appRoutines.run.analyze(app, req, res, level);

					function sendLevel() {
						if (api) return res.send(level);

						// else return fs.readFile('./html/level.html', 'utf8', function (err, data) {
						// 	let html = data.toString();
						// 	let variables = Object.keys(level);
						// 	variables.forEach(x => {
						// 		let regex = new RegExp(`\\[\\[${x.toUpperCase()}\\]\\]`, "g");
						// 		html = html.replace(regex, appRoutines.clean(level[x]));
						// 	})
						// 	return res.send(html);
						// })
						res.render("level", { level })
					}

					if (levelID < 0) {
						reqBundle.gdRequest('getGJDailyLevel', { weekly: levelID == -2 ? "1" : "0" }, function (err, resp, dailyInfo) {
							if (err || dailyInfo == "-1") return sendLevel();
							let dailyTime = dailyInfo?.split("|")[1] || "0";
							level.nextDaily = +dailyTime;
							level.nextDailyTimestamp = Math.round((Date.now() + (+dailyTime * 1000)) / 100000) * 100000;
							return sendLevel();
						})  
					}

					else if (reqBundle.server.demonList && level.difficulty == "Extreme Demon") {
						request.get(reqBundle.server.demonList + 'api/v2/demons/?name=' + level.name.trim()).then(function (resp) {
							let demonList: string = resp.data.toString();
							let demon: any[] = JSON.parse(demonList);
							if (demon[0] && demon[0].position) level.demonList = demon[0].position;
						}).finally(function() {
							return sendLevel();
						})
					}
					else return sendLevel();
				});
			});
		});
	});
}