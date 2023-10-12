import request, { AxiosResponse } from 'axios';
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";
import { SearchQueryLevel } from '../classes/Level.js';
let demonList = {};

interface SearchFilters {
    str?: string;
    diff?: string;
    demonFilter?: string;
    page?: number;
    gauntlet?: number;
    len?: string;
    song?: string;
    followed?: string;
    featured?: number;
    originalOnly?: number;
    twoPlayer?: number;
    coins?: number;
	epic?: number;
	star?: number;
	noStar?: number;
	customSong?: number;
	type?: number;
    count?: number;
}

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return res.status(500).send(req.query.hasOwnProperty("err") ? "err" : "-1");

	let demonMode = req.query.hasOwnProperty("demonlist") || req.query.hasOwnProperty("demonList") || req.query.type == "demonlist" || req.query.type == "demonList";
	let url1 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100';
	let url2 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100&after=100';
	if (demonMode) {
		if (!reqBundle.server.demonList) return sendError(400);
		let dList = demonList[reqBundle.id];
		if (!dList || !dList.list.length || dList.lastUpdated + 600000 < Date.now()) {  // 10 minute cache
			return request.get(url1).then(async function(resp1: AxiosResponse){
				return request.get(url2).then(async function(resp2: AxiosResponse) {
					const list1 = resp1.data;
					const list2 = resp2.data;
					demonList[reqBundle.id] = {
						list: JSON.parse(list1).concat(JSON.parse(list2)).map((x: { level_id: any }) => String(x.level_id)),
						lastUpdated: Date.now()
					};
				}).catch(function(err2: any) {
					return sendError();
				});
			}).catch(function(err1: any) {
				return sendError();
			});
		}
	}

	let amount = 10;
	let count = reqBundle.isGDPS ? 10 : +(req.query.count || 0);
	if (count && count > 0) {
	  if (count > 500) amount = 500;
	  else amount = count;
	}
	
	let filters: SearchFilters = {
		str: req.params.text,

		diff: req.query.diff?.toString(),
		demonFilter: req.query.demonFilter?.toString() || "",
		page: +(req.query.page || 0),
		gauntlet: +(req.query.gauntlet || 0),
		len: req.query.length?.toString() || "",
		song: req.query.songID?.toString() || "",
		followed: req.query.creators?.toString() || "",

		featured: req.query.hasOwnProperty("featured") ? 1 : 0,
		originalOnly: req.query.hasOwnProperty("original") ? 1 : 0,
		twoPlayer: req.query.hasOwnProperty("twoPlayer") ? 1 : 0,
		coins: req.query.hasOwnProperty("coins") ? 1 : 0,
		epic: req.query.hasOwnProperty("epic") ? 1 : 0,
		star: req.query.hasOwnProperty("starred") ? 1 : 0,
		noStar: req.query.hasOwnProperty("noStar") ? 1 : 0,
		customSong: req.query.hasOwnProperty("customSong") ? 1 : 0,

		type: +(req.query.type || 0),
		count: amount,
	}
	for (const entry in filters) {
		if (!filters[entry]) delete filters[entry];
	}
	if (!filters.type) filters.type = 0;

	if (req.query.type) {
		let filterCheck = req.query.type.toString().toLowerCase();
		switch(filterCheck) {
			case 'mostdownloaded': filters.type = 1; break;
			case 'mostliked': filters.type = 2; break;
			case 'trending': filters.type = 3; break;
			case 'recent': filters.type = 4; break;
			case 'featured': filters.type = 6; break;
			case 'magic': filters.type = 7; break;
			case 'awarded':
			case 'starred': filters.type = 11; break;
			case 'halloffame':
			case 'hof': filters.type = 16; break;
			case 'gdw':
			case 'gdworld': filters.type = 17; break;
		}
	}

	if (req.query.hasOwnProperty("user")) {
		let accountCheck = appRoutines.userCache(reqBundle.id, filters.str || "", "", "");
		filters.type = 5;
		if (accountCheck) filters.str = accountCheck[1];
		else if (!filters.str?.match(/^[0-9]*$/)) {
			return appRoutines.run.profile(app, req, res, null, req.params.text);
		}
	} 

	if (req.query.hasOwnProperty("creators")) filters.type = 12;

	let listSize = 10;
	if (demonMode || req.query.gauntlet || req.query.type == "saved" || ["mappack", "list", "saved"].some(x => req.query.hasOwnProperty(x))) {
		filters.type = 10;
		filters.str = demonMode ? demonList[reqBundle.id].list : filters.str!.split(",");
		listSize = filters.str!.length;
		filters.str = filters.str!.slice((filters.page || 0) * amount, (filters.page || 0) * amount + amount);
		if (!filters.str.length) return sendError(400);
		// TODO: Make a "map" for strings
		// filters.str = filters.str.map(x => String(Number(x) + +(req.query.len || 0))).join()
		filters.page = 0
	}

	if (reqBundle.isGDPS && filters.diff && !filters.len) filters.len = "-";

	if (filters.str == "*") delete filters.str;
	reqBundle.gdRequest('getGJLevels21', reqBundle.gdParams(filters as any), function(err, resp, body) {
		if (err) return sendError();
		let splitBody = body?.split('#') || [];
		let preRes = splitBody[0].split('|');
		let authorList = {};
		let songList = {};
		let authors = splitBody[1].split('|');
		let songString = splitBody[2];
		let songs = songString.split('~:~').map(x => appRoutines.parseResponse(`~${x}~`, '~|~'));
		songs.forEach(x => {
			songList[x['~1']] = x['2'];
		});

		authors.forEach(x => {
			if (x.startsWith('~')) return;
			let arr = x.split(':');
			authorList[arr[0]] = [arr[1], arr[2]];
		});

		let levelArray = preRes.map(x => appRoutines.parseResponse(x)).filter(x => x[1]);
		let parsedLevels: SearchQueryLevel[] = [];

		levelArray.forEach((x, y) => {

			let songSearch = songs.find(y => y['~1'] == x[35]) || [];

			// TODO: Check if songSearch is a songInfo
			let level = new SearchQueryLevel(x as any, reqBundle.server as any, null).getSongInfo(songSearch as any);
			if (!level.id) return;
			level.author = authorList[x[6]] ? authorList[x[6]][0] : "-";
			level.accountID = authorList[x[6]] ? authorList[x[6]][1] : "0";

			if (demonMode) {
				if (!y) level.demonList = reqBundle.server.demonList;
				level.demonPosition = demonList[reqBundle.id].list.indexOf(level.id) + 1;
			}

			if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;
			if (level.author != "-" && appRoutines.config.cacheAccountIDs) appRoutines.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

			//this is broken if you're not on page 0, blame robtop
			if (filters.page == 0 && y == 0 && splitBody[3]) {
				let pages = splitBody[3].split(":");

				if (filters.gauntlet) {  // gauntlet page stuff
					level.results = levelArray.length;
					level.pages = 1;
				}
				else if (filters.type == 10) {  //  custom page stuff
					level.results = listSize;
					level.pages = +Math.ceil(listSize / (amount || 10));
				}
				else {  // normal page stuff
					level.results = +pages[0];
					level.pages = +pages[0] == 9999 ? 1000 : +Math.ceil(+pages[0] / amount);
				}
			}

			parsedLevels[y] = level;
		})

		if (filters.type == 10) parsedLevels = parsedLevels.slice(+(filters.page || 0) * amount, (+(filters.page || 0) + 1) * amount);
		return res.send(parsedLevels);
	});
}